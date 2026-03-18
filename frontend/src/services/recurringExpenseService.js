import api from './api'

const recurringExpenseService = {
  getAllRecurringExpenses: async (params = {}) => {
    const response = await api.get('/recurring-expenses', { params })
    return response.data
  },

  getRecurringExpense: async (id) => {
    const response = await api.get(`/recurring-expenses/${id}`)
    return response.data
  },

  createRecurringExpense: async (payload) => {
    const response = await api.post('/recurring-expenses', payload)
    return response.data
  },

  updateRecurringExpense: async (id, payload) => {
    const response = await api.patch(`/recurring-expenses/${id}`, payload)
    return response.data
  },

  deleteRecurringExpense: async (id) => {
    const response = await api.delete(`/recurring-expenses/${id}`)
    return response.data
  },

  pauseRecurringExpense: async (id) => {
    const response = await api.patch(`/recurring-expenses/${id}/pause`)
    return response.data
  },

  resumeRecurringExpense: async (id) => {
    const response = await api.patch(`/recurring-expenses/${id}/resume`)
    return response.data
  },

  generateRecurringExpenses: async () => {
    const response = await api.post('/recurring-expenses/generate')
    return response.data
  }
}

export default recurringExpenseService
