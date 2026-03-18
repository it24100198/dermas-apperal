import api from './api'

const employeeService = {
	getAllEmployees: async (params = {}) => {
		const response = await api.get('/employees', { params })
		return response.data
	},

	getEmployee: async (id) => {
		const response = await api.get(`/employees/${id}`)
		return response.data
	},

	createEmployee: async (payload) => {
		const response = await api.post('/employees', payload)
		return response.data
	},

	updateEmployee: async (id, payload) => {
		const response = await api.patch(`/employees/${id}`, payload)
		return response.data
	},

	updateEmployeeStatus: async (id, status) => {
		const response = await api.patch(`/employees/${id}/status`, { status })
		return response.data
	},

	deleteEmployee: async (id, hardDelete = false) => {
		const response = await api.delete(`/employees/${id}`, {
			params: { hardDelete }
		})
		return response.data
	},

	getEmployeeStats: async () => {
		const response = await api.get('/employees/stats')
		return response.data
	}
}

export default employeeService
