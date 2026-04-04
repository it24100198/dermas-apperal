import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname || '';
      window.location.href = path.startsWith('/supervisor') ? '/supervisor/login' : '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Manufacturing
export const getManufacturingOverview = () => api.get('/manufacturing/overview');
export const listCuttingJobs = () => api.get('/manufacturing/cutting');
export const saveCutting = (jobId, data) => api.post(`/manufacturing/cutting/${jobId}`, data);
export const getWashing = () => api.get('/manufacturing/washing');
export const createWashingTransfer = (data) => api.post('/manufacturing/washing/transfers', data);
export const receiveWashingTransfer = (id) => api.post(`/manufacturing/washing/transfers/${id}/receive`);
export const completeWashingTransfer = (id) => api.post(`/manufacturing/washing/transfers/${id}/complete`);
export const listQc = () => api.get('/manufacturing/qc');
export const getQcDetail = (transferId) => api.get(`/manufacturing/qc/${transferId}`);
export const saveQc = (transferId, data) => api.post(`/manufacturing/qc/${transferId}`, data);
export const getJobQcDetail = (jobId) => api.get(`/manufacturing/qc/job/${jobId}`);
export const saveQcForTransfer = (transferId, data) => api.post(`/manufacturing/qc/transfer/${transferId}`, data);
export const issueAccessoryToBatch = (batchId, data) => api.post(`/manufacturing/qc/batches/${batchId}/accessories`, data);
export const sendBatchToFinalCheck = (batchId) => api.post(`/manufacturing/qc/batches/${batchId}/send-to-final`);
export const listFinalJobs = () => api.get('/manufacturing/final');
export const getFinalJobDetail = (jobId) => api.get(`/manufacturing/final/${jobId}`);
export const finalizeBatch = (batchId) => api.post(`/manufacturing/final/batches/${batchId}/finalize`);

export const listProductRecipes = () => api.get('/manufacturing/recipes');
export const getRecipeForProduct = (productId) => api.get(`/manufacturing/recipes/product/${productId}`);
export const upsertProductRecipe = (productId, data) => api.put(`/manufacturing/recipes/product/${productId}`, data);
export const deleteProductRecipe = (productId) => api.delete(`/manufacturing/recipes/product/${productId}`);

// Jobs
export const listJobs = (params) => api.get('/jobs', { params });
export const getJob = (jobId) => api.get(`/jobs/${jobId}`);
export const createJob = (data) => api.post('/jobs', data);
export const sendJobToCutting = (jobId) => api.post(`/jobs/${jobId}/send-to-cutting`);
export const getAssignLinesMeta = (jobId) => api.get(`/jobs/${jobId}/assign-lines/meta`);
export const assignLines = (jobId, data) => api.post(`/jobs/${jobId}/assign-lines`, data);

// Production
export const listHourlyJobs = () => api.get('/production/hourly');
export const saveHourlyProduction = (data) => api.post('/production/hourly', data);
export const getHourlyRecords = (jobId) => api.get(`/production/hourly/${jobId}`);
export const completeLineProduction = (jobId) => api.post(`/production/hourly/${jobId}/complete-line`);

// Supervisor
export const getSupervisorDashboard = () => api.get('/supervisor/dashboard');
export const completeLine = (jobId) => api.post(`/supervisor/lines/${jobId}/complete`);

// Meta
export const getMaterials = () => api.get('/meta/materials');
export const createManufacturingMaterial = (data) => api.post('/meta/materials', data);
export const updateManufacturingMaterial = (id, data) => api.put(`/meta/materials/${id}`, data);
export const getProducts = () => api.get('/meta/products');
export const getEmployees = () => api.get('/meta/employees');
export const getSections = (params) => api.get('/meta/sections', { params });
export const updateSection = (id, data) => api.put(`/meta/sections/${id}`, data);
export const createEmployee = (data) => api.post('/meta/employees', data);
export const updateEmployee = (id, data) => api.put(`/meta/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/meta/employees/${id}`);

// ── Manufactured Products ─────────────────────────────────────────────────────
export const getProductSummary = () => api.get('/products/summary');
export const listManufacturedProducts = (params) => api.get('/products', { params });
export const getManufacturedProduct = (id) => api.get(`/products/${id}`);
export const createManufacturedProduct = (data) => api.post('/products', data);
export const updateManufacturedProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteManufacturedProduct = (id) => api.delete(`/products/${id}`);

// Product Categories / Brands / Units
export const listProductCategories = () => api.get('/products/meta/categories');
export const createProductCategory = (data) => api.post('/products/meta/categories', data);
export const updateProductCategory = (id, data) => api.put(`/products/meta/categories/${id}`, data);
export const deleteProductCategory = (id) => api.delete(`/products/meta/categories/${id}`);

export const listProductBrands = () => api.get('/products/meta/brands');
export const createProductBrand = (data) => api.post('/products/meta/brands', data);
export const updateProductBrand = (id, data) => api.put(`/products/meta/brands/${id}`, data);
export const deleteProductBrand = (id) => api.delete(`/products/meta/brands/${id}`);

export const listProductUnits = () => api.get('/products/meta/units');
export const createProductUnit = (data) => api.post('/products/meta/units', data);
export const updateProductUnit = (id, data) => api.put(`/products/meta/units/${id}`, data);
export const deleteProductUnit = (id) => api.delete(`/products/meta/units/${id}`);

