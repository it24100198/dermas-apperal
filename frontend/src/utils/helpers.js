export const getErrorMessage = (error, fallback = 'Something went wrong') => {
	console.log('Error object:', error)
	
	if (!error) {
		return fallback
	}

	// Check for response data message
	if (error.response?.data?.message) {
		return error.response.data.message
	}

	// Check for validation errors
	if (error.response?.data?.errors) {
		const firstErrorGroup = Object.values(error.response.data.errors)[0]
		if (Array.isArray(firstErrorGroup) && firstErrorGroup.length > 0) {
			return firstErrorGroup[0]
		}
	}

	// Check for timeout
	if (error.code === 'ECONNABORTED') {
		return 'Request timeout. Please check your connection and try again.'
	}

	// Check for network errors
	if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
		return 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000'
	}

	// Check if it's a connection refused error
	if (error.message?.includes('ECONNREFUSED')) {
		return 'Backend server is not running. Please start the backend first.'
	}

	// Check for other axios errors
	if (error.message) {
		return error.message
	}

	return fallback
}

export const toQueryParams = (payload = {}) => {
	const params = new URLSearchParams()
	Object.entries(payload).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, String(value))
		}
	})
	return params.toString()
}

export const downloadBlob = (blob, filename) => {
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	a.remove()
	window.URL.revokeObjectURL(url)
}
