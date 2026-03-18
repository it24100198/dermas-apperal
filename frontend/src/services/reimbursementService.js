import api from './api'

const reimbursementService = {
	getAllReimbursements: async (params = {}) => {
		const response = await api.get('/reimbursements', { params })
		return response.data
	},

	getReimbursement: async (id) => {
		const response = await api.get(`/reimbursements/${id}`)
		return response.data
	},

	submitClaim: async (payload) => {
		const response = await api.post('/reimbursements', payload, {
			headers: { 'Content-Type': 'multipart/form-data' }
		})
		return response.data
	},

	updateStatus: async (id, status, reason) => {
		const response = await api.patch(`/reimbursements/${id}/status`, { status, reason })
		return response.data
	},

	markAsPaid: async (id, payload = {}) => {
		const response = await api.patch(`/reimbursements/${id}/paid`, payload)
		return response.data
	},

	getSummary: async (params = {}) => {
		const response = await api.get('/reimbursements/summary', { params })
		return response.data
	}
}

export default reimbursementService
