import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zinoshop.onrender.com'

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
      error.message = 'Cannot connect to server. Please make sure the backend is running at https://zinoshop.onrender.com/.'
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

