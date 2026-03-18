import api from './api'

const vendorService = {
  getAllVendors: async (params = {}) => {
    const response = await api.get('/vendors', { params })
    return response.data
  },

  getVendor: async (id) => {
    const response = await api.get(`/vendors/${id}`)
    return response.data
  },

  createVendor: async (payload) => {
    const response = await api.post('/vendors', payload)
    return response.data
  },

  updateVendor: async (id, payload) => {
    const response = await api.patch(`/vendors/${id}`, payload)
    return response.data
  },

  deleteVendor: async (id) => {
    const response = await api.delete(`/vendors/${id}`)
    return response.data
  },

  getVendorStats: async () => {
    const response = await api.get('/vendors/stats')
    return response.data
  }
}

export default vendorService
