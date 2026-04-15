import { api } from './client';

const P = '/purchase';

const unwrapItems = (data) => (Array.isArray(data) ? data : data?.items || []);
const unwrapList = (data) => {
	if (Array.isArray(data)) {
		return { items: data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
	}
	return data;
};

// ── Suppliers ─────────────────────────────────
export const getSuppliers = (params = {}) => api.get(`${P}/suppliers`, { params }).then(r => unwrapItems(r.data));
export const getSuppliersList = (params = {}) => api.get(`${P}/suppliers`, { params: { ...params, paginated: true } }).then(r => unwrapList(r.data));
export const createSupplier = (data) => api.post(`${P}/suppliers`, data).then(r => r.data);
export const updateSupplier = (id, data) => api.put(`${P}/suppliers/${id}`, data).then(r => r.data);
export const deleteSupplier = (id) => api.delete(`${P}/suppliers/${id}`).then(r => r.data);

// ── Materials ─────────────────────────────────
export const getMaterials = (params = {}) => api.get(`${P}/materials`, { params }).then(r => unwrapItems(r.data));
export const getMaterialsList = (params = {}) => api.get(`${P}/materials`, { params: { ...params, paginated: true } }).then(r => unwrapList(r.data));
export const getReorderAlerts = () => api.get(`${P}/materials/reorder-alerts`).then(r => r.data);
export const createMaterial = (data) => api.post(`${P}/materials`, data).then(r => r.data);
export const updateMaterial = (id, data) => api.put(`${P}/materials/${id}`, data).then(r => r.data);
export const deleteMaterial = (id) => api.delete(`${P}/materials/${id}`).then(r => r.data);

// ── Requisitions ──────────────────────────────
export const getRequisitions = (params = {}) => api.get(`${P}/requisitions`, { params }).then(r => unwrapItems(r.data));
export const getRequisitionsList = (params = {}) => api.get(`${P}/requisitions`, { params: { ...params, paginated: true } }).then(r => unwrapList(r.data));
export const createRequisition = (data) => api.post(`${P}/requisitions`, data).then(r => r.data);
export const approveRequisition = (id, data) => api.put(`${P}/requisitions/${id}/approve`, data).then(r => r.data);
export const rejectRequisition = (id, data) => api.put(`${P}/requisitions/${id}/reject`, data).then(r => r.data);

// ── Purchase Orders ───────────────────────────
export const getPurchaseOrders = (params = {}) => api.get(`${P}/orders`, { params }).then(r => unwrapItems(r.data));
export const getPurchaseOrdersList = (params = {}) => api.get(`${P}/orders`, { params: { ...params, paginated: true } }).then(r => unwrapList(r.data));
export const createPurchaseOrder = (data) => api.post(`${P}/orders`, data).then(r => r.data);
export const updatePurchaseOrder = (id, data) => api.put(`${P}/orders/${id}`, data).then(r => r.data);
export const deletePurchaseOrder = (id) => api.delete(`${P}/orders/${id}`).then(r => r.data);

// ── GRN ───────────────────────────────────────
export const getGRNs = (params = {}) => api.get(`${P}/grn`, { params }).then(r => unwrapItems(r.data));
export const getGRNsList = (params = {}) => api.get(`${P}/grn`, { params: { ...params, paginated: true } }).then(r => unwrapList(r.data));
export const createGRN = (data) => api.post(`${P}/grn`, data).then(r => r.data);
export const recordGRNPayment = (id, data) => api.put(`${P}/grn/${id}/payment`, data).then(r => r.data);

// ── Analytics ─────────────────────────────────
export const getPurchaseAnalytics = (year) => api.get(`${P}/analytics/summary`, { params: { year } }).then(r => r.data);
