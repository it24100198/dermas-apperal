import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const reqUrl = String(err.config?.url || '');
      const isAuthFormRequest =
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/auth/register-request') ||
        reqUrl.includes('/auth/register') ||
        reqUrl.includes('/auth/forgot-password') ||
        reqUrl.includes('/auth/reset-password');
      if (isAuthFormRequest) return Promise.reject(err);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      const path = window.location.pathname || '';
      window.location.href = path.startsWith('/supervisor') ? '/supervisor/login' : '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (payload) => api.post('/auth/register', payload);
export const submitRegistrationRequest = (payload) => api.post('/auth/register-request', payload);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });
export const lookupRegistrationRequestStatus = (email, requestId) =>
  api.get('/auth/registration-requests/status', { params: { email, requestId } });
export const getMe = () => api.get('/auth/me');
export const listRegistrationRequests = (status) => api.get('/auth/registration-requests', { params: { status } });
export const getRegistrationRequestDetail = (id) => api.get(`/auth/registration-requests/${id}`);
export const approveRegistrationRequest = (id, data) => api.post(`/auth/registration-requests/${id}/approve`, data);
export const rejectRegistrationRequest = (id, data) => api.post(`/auth/registration-requests/${id}/reject`, data);

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
export const issueAccessoryToBatch = (batchId, data) => api.post(`/manufacturing/qc/batches/${batchId}/accessories`, data);
export const sendBatchToFinalCheck = (batchId) => api.post(`/manufacturing/qc/batches/${batchId}/send-to-final`);
export const listFinalJobs = () => api.get('/manufacturing/final');
export const getFinalJobDetail = (jobId) => api.get(`/manufacturing/final/${jobId}`);
export const finalizeBatch = (batchId) => api.post(`/manufacturing/final/batches/${batchId}/finalize`);

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

// Customer Orders
export const listCustomerOrders = (params) => api.get('/orders', { params });
export const getCustomerOrder = (id) => api.get(`/orders/${id}`);
export const createCustomerOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const updateOrderDeliveryDate = (id, data) => api.patch(`/orders/${id}/delivery-date`, data);
export const getOrderStats = () => api.get('/orders/stats');
export const deleteCustomerOrder = (id) => api.delete(`/orders/${id}`);

