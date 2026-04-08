import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const P = `${BASE}/purchase`;

// ── Suppliers ─────────────────────────────────
export const getSuppliers = (params = {}) => axios.get(`${P}/suppliers`, { params }).then(r => r.data);
export const createSupplier = (data) => axios.post(`${P}/suppliers`, data).then(r => r.data);
export const updateSupplier = (id, data) => axios.put(`${P}/suppliers/${id}`, data).then(r => r.data);
export const deleteSupplier = (id) => axios.delete(`${P}/suppliers/${id}`).then(r => r.data);

// ── Materials ─────────────────────────────────
export const getMaterials = () => axios.get(`${P}/materials`).then(r => r.data);
export const getReorderAlerts = () => axios.get(`${P}/materials/reorder-alerts`).then(r => r.data);
export const createMaterial = (data) => axios.post(`${P}/materials`, data).then(r => r.data);
export const updateMaterial = (id, data) => axios.put(`${P}/materials/${id}`, data).then(r => r.data);
export const deleteMaterial = (id) => axios.delete(`${P}/materials/${id}`).then(r => r.data);

// ── Requisitions ──────────────────────────────
export const getRequisitions = (params = {}) => axios.get(`${P}/requisitions`, { params }).then(r => r.data);
export const createRequisition = (data) => axios.post(`${P}/requisitions`, data).then(r => r.data);
export const approveRequisition = (id, data) => axios.put(`${P}/requisitions/${id}/approve`, data).then(r => r.data);
export const rejectRequisition = (id, data) => axios.put(`${P}/requisitions/${id}/reject`, data).then(r => r.data);

// ── Purchase Orders ───────────────────────────
export const getPurchaseOrders = (params = {}) => axios.get(`${P}/orders`, { params }).then(r => r.data);
export const createPurchaseOrder = (data) => axios.post(`${P}/orders`, data).then(r => r.data);
export const updatePurchaseOrder = (id, data) => axios.put(`${P}/orders/${id}`, data).then(r => r.data);
export const deletePurchaseOrder = (id) => axios.delete(`${P}/orders/${id}`).then(r => r.data);

// ── GRN ───────────────────────────────────────
export const getGRNs = (params = {}) => axios.get(`${P}/grn`, { params }).then(r => r.data);
export const createGRN = (data) => axios.post(`${P}/grn`, data).then(r => r.data);
export const recordGRNPayment = (id, data) => axios.put(`${P}/grn/${id}/payment`, data).then(r => r.data);

// ── Analytics ─────────────────────────────────
export const getPurchaseAnalytics = (year) => axios.get(`${P}/analytics/summary`, { params: { year } }).then(r => r.data);
