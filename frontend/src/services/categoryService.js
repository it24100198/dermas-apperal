import api from './api'

const categoryService = {
	getAllCategories: async (params = {}) => {
		const response = await api.get('/categories', { params })
		return response.data
	},

	getCategoryTree: async () => {
		const response = await api.get('/categories/tree')
		return response.data
	},

	getCategory: async (id) => {
		const response = await api.get(`/categories/${id}`)
		return response.data
	},

	createCategory: async (payload) => {
		const response = await api.post('/categories', payload)
		return response.data
	},

	updateCategory: async (id, payload) => {
		const response = await api.patch(`/categories/${id}`, payload)
		return response.data
	},

	deleteCategory: async (id) => {
		const response = await api.delete(`/categories/${id}`)
		return response.data
	},

	seedDefaultCategories: async () => {
		const response = await api.post('/categories/seed-defaults')
		return response.data
	}
}

export default categoryService
