import api from './api'

const expenseService = {
	getAllExpenses: async (params = {}) => {
		const response = await api.get('/expenses', { params })
		return response.data
	},

	getExpense: async (id) => {
		const response = await api.get(`/expenses/${id}`)
		return response.data
	},

	createExpense: async (payload) => {
		const response = await api.post('/expenses', payload, {
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		return response.data
	},

	updateExpense: async (id, payload) => {
		const response = await api.patch(`/expenses/${id}`, payload, {
			headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
		})
		return response.data
	},

	deleteExpense: async (id) => {
		const response = await api.delete(`/expenses/${id}`)
		return response.data
	},

	approveExpense: async (id) => {
		const response = await api.patch(`/expenses/${id}/approve`)
		return response.data
	},

	rejectExpense: async (id, reason) => {
		const response = await api.patch(`/expenses/${id}/reject`, { reason })
		return response.data
	},

	addExpenseComment: async (id, comment) => {
		const response = await api.patch(`/expenses/${id}/comments`, { comment })
		return response.data
	},

	bulkCreateExpenses: async (expenses) => {
		const response = await api.post('/expenses/bulk', { expenses })
		return response.data
	},

	getExpenseStats: async (params = {}) => {
		const response = await api.get('/expenses/stats', { params })
		return response.data
	}
}

export default expenseService
