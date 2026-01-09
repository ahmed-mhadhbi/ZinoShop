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

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error: Backend server may not be running')
      error.message = `Cannot connect to server at ${API_URL}. Please make sure the backend is reachable.`
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

