import axios from 'axios';

const API_URL = String(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productAPI = {
  getProducts: (params) => api.get('/products', { params }), // Expects { search, category, page, limit } etc.
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  updateStock: (id, stockData) => api.patch(`/products/${id}/stock`, stockData), // Expects { quantity, type } etc.
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const transactionAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
};

export const issuanceAPI = {
  getIssuances: (params) => api.get('/issuances', { params }),
  createIssuance: (issuanceData) => api.post('/issuances', issuanceData),
};

export default api;
