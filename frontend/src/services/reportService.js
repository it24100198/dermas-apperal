import api from './api'

const reportService = {
	getMonthlyExpenseReport: async (params) => {
		const response = await api.get('/reports/monthly-expenses', { params })
		return response.data
	},

	getYearlyExpenseReport: async (params) => {
		const response = await api.get('/reports/yearly-expenses', { params })
		return response.data
	},

	getDepartmentSpending: async (params) => {
		const response = await api.get('/reports/department-spending', { params })
		return response.data
	},

	getProfitLoss: async (params) => {
		const response = await api.get('/reports/profit-loss', { params })
		return response.data
	},

	getAnalytics: async (params) => {
		const response = await api.get('/reports/analytics', { params })
		return response.data
	},

	exportCsv: async (params) => {
		const response = await api.get('/reports/export/csv', {
			params,
			responseType: 'blob'
		})
		return response.data
	},

	exportJson: async (params) => {
		const response = await api.get('/reports/export/json', { params })
		return response.data
	}
}

export default reportService
