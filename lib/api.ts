import axios from 'axios'

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zinoshop.onrender.com'
let API_URL = DEFAULT_API_URL

// Runtime fallback: if the app is running on the deployed frontend but was built with a localhost default,
// force the production backend so clients don't call localhost from the browser.
if (typeof window !== 'undefined') {
  if (window.location.hostname === 'zino-shop.vercel.app' && DEFAULT_API_URL.includes('localhost')) {
    API_URL = 'https://zinoshop.onrender.com'
  }
  // Helpful for debugging in browser consoles
  // eslint-disable-next-line no-console
  console.info('ZinoShop API_URL:', API_URL)
}

const MAX_RETRIES = 2
const INITIAL_BACKOFF = 500 // ms

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 second timeout to tolerate slower responses in production
})

// Simple retry logic for GET requests on network failures / timeouts / 5xx
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config
    if (!config) return Promise.reject(error)

    // Only retry GET requests
    if (config.method && config.method.toLowerCase() === 'get') {
      config.__retryCount = config.__retryCount || 0
      const shouldRetry =
        (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) &&
        config.__retryCount < MAX_RETRIES

      if (shouldRetry) {
        config.__retryCount += 1
        const backoff = INITIAL_BACKOFF * 2 ** (config.__retryCount - 1)
        await new Promise((res) => setTimeout(res, backoff))
        return api(config)
      }
    }

    // Standardize error messages
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error: Backend server may not be running')
      error.message = `Cannot connect to server at ${API_URL}. Please make sure the backend is reachable.`
    }

    if (error.code === 'ECONNABORTED') {
      error.message = `Request to ${API_URL} timed out after ${api.defaults.timeout}ms.`
    }

    return Promise.reject(error)
  }
)

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  return config
})

export default api

