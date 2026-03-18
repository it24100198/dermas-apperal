import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setCredentials, logout, setLoading, setError, clearError } = authSlice.actions
export default authSlice.reducer