import api from './api'

const authService = {
	login: async (email, password) => {
		try {
			console.log('Attempting login to:', api.defaults.baseURL + '/auth/login')
			const response = await api.post('/auth/login', { email, password })
			console.log('Auth response:', response.data)
			if (response.data?.token && response.data?.data?.user) {
				return {
					user: response.data.data.user,
					token: response.data.token
				}
			}
			throw new Error('Invalid response format from server')
		} catch (error) {
			console.error('Auth service login error details:')
			console.error('Message:', error.message)
			console.error('Code:', error.code)
			console.error('Config:', error.config)
			console.error('Full error:', error)
			throw error
		}
	},

	register: async (payload) => {
		const response = await api.post('/auth/register', payload)
		const userPayload = response.data?.data?.user
			? { user: response.data.data.user, token: response.data.token }
			: response.data
		return userPayload
	},

	logout: async () => {
		const response = await api.post('/auth/logout')
		return response.data
	},

	forgotPassword: async (email) => {
		const response = await api.post('/auth/forgot-password', { email })
		return response.data
	},

	resetPassword: async (token, password) => {
		const response = await api.patch(`/auth/reset-password/${token}`, { password })
		return response.data
	},

	getMe: async () => {
		const response = await api.get('/auth/me')
		return response.data
	}
}

export default authService
