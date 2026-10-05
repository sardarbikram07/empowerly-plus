import axios from 'axios'

/**
 * Axios instance.
 * Base URL is read from the VITE_API_URL environment variable at build time.
 * In development, Vite's proxy forwards /api requests to localhost:8080,
 * so you can leave VITE_API_URL empty in .env.local and rely on the proxy.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: on 401 redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
