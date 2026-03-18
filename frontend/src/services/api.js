import axios from 'axios'
import toast from 'react-hot-toast'
import { store } from '../store/store'
import { logout } from '../store/slices/authSlice'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message, error.code, error)
    
    const { response } = error
    
    // Don't show toast for auth endpoints - let the component handle it
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    
    // Handle unauthorized errors (but not on auth pages)
    if (response?.status === 401 && !isAuthEndpoint) {
      store.dispatch(logout())
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    }
    
    // Handle forbidden errors
    if (response?.status === 403) {
      toast.error('You do not have permission to perform this action')
    }
    
    // Handle server errors
    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

export default api