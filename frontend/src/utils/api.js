import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productAPI = {
  getProducts: (params) => api.get('/api/products', { params }), // Expects { search, category, page, limit } etc.
  createProduct: (productData) => api.post('/api/products', productData),
  updateProduct: (id, productData) => api.put(`/api/products/${id}`, productData),
  updateStock: (id, stockData) => api.patch(`/api/products/${id}/stock`, stockData), // Expects { quantity, type } etc.
  deleteProduct: (id) => api.delete(`/api/products/${id}`),
};

export const transactionAPI = {
  getTransactions: (params) => api.get('/api/transactions', { params }),
  createTransaction: (transactionData) => api.post('/api/transactions', transactionData),
};

export const issuanceAPI = {
  getIssuances: (params) => api.get('/api/issuances', { params }),
  createIssuance: (issuanceData) => api.post('/api/issuances', issuanceData),
};

export default api;
