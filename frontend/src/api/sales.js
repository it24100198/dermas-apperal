import { api } from './client';

const S = '/sales';

// ── Quotations ─────────────────────────────────
export const getQuotations    = (p) => api.get(`${S}/quotations`, { params: p }).then(r => r.data);
export const createQuotation  = (d) => api.post(`${S}/quotations`, d).then(r => r.data);
export const updateQuotation  = (id, d) => api.put(`${S}/quotations/${id}`, d).then(r => r.data);
export const deleteQuotation  = (id) => api.delete(`${S}/quotations/${id}`).then(r => r.data);
export const convertQuotation = (id, d) => api.put(`${S}/quotations/${id}/convert`, d).then(r => r.data);

// ── Sales Orders ───────────────────────────────
export const getSalesOrders   = (p) => api.get(`${S}/orders`, { params: p }).then(r => r.data);
export const createSalesOrder = (d) => api.post(`${S}/orders`, d).then(r => r.data);
export const updateSalesOrder = (id, d) => api.put(`${S}/orders/${id}`, d).then(r => r.data);
export const deleteSalesOrder = (id) => api.delete(`${S}/orders/${id}`).then(r => r.data);

// ── Invoices ───────────────────────────────────
export const getInvoices      = (p) => api.get(`${S}/invoices`, { params: p }).then(r => r.data);
export const createInvoice    = (d) => api.post(`${S}/invoices`, d).then(r => r.data);
export const updateInvoice    = (id, d) => api.put(`${S}/invoices/${id}`, d).then(r => r.data);
export const recordPayment    = (id, d) => api.post(`${S}/invoices/${id}/payment`, d).then(r => r.data);
export const createCreditNote = (id, d) => api.post(`${S}/invoices/${id}/credit-note`, d).then(r => r.data);
export const getAgingReport   = () => api.get(`${S}/invoices/aging`).then(r => r.data);

// ── Delivery Orders ────────────────────────────
export const getDeliveryOrders  = (p) => api.get(`${S}/delivery`, { params: p }).then(r => r.data);
export const createDeliveryOrder= (d) => api.post(`${S}/delivery`, d).then(r => r.data);
export const updateDeliveryOrder= (id, d) => api.put(`${S}/delivery/${id}`, d).then(r => r.data);
export const deleteDeliveryOrder= (id) => api.delete(`${S}/delivery/${id}`).then(r => r.data);

// ── Sales Returns ──────────────────────────────
export const getSalesReturns   = (p) => api.get(`${S}/returns`, { params: p }).then(r => r.data);
export const createSalesReturn = (d) => api.post(`${S}/returns`, d).then(r => r.data);
export const approveReturn     = (id, d) => api.put(`${S}/returns/${id}/approve`, d).then(r => r.data);
export const rejectReturn      = (id, d) => api.put(`${S}/returns/${id}/reject`, d).then(r => r.data);

// ── Analytics ─────────────────────────────────
export const getSalesAnalytics = (year) => api.get(`${S}/analytics/summary`, { params: { year } }).then(r => r.data);
