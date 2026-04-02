import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const S = `${BASE}/sales`;

// ── Quotations ─────────────────────────────────
export const getQuotations    = (p) => axios.get(`${S}/quotations`, { params: p }).then(r => r.data);
export const createQuotation  = (d) => axios.post(`${S}/quotations`, d).then(r => r.data);
export const updateQuotation  = (id, d) => axios.put(`${S}/quotations/${id}`, d).then(r => r.data);
export const deleteQuotation  = (id) => axios.delete(`${S}/quotations/${id}`).then(r => r.data);
export const convertQuotation = (id, d) => axios.put(`${S}/quotations/${id}/convert`, d).then(r => r.data);

// ── Sales Orders ───────────────────────────────
export const getSalesOrders   = (p) => axios.get(`${S}/orders`, { params: p }).then(r => r.data);
export const createSalesOrder = (d) => axios.post(`${S}/orders`, d).then(r => r.data);
export const updateSalesOrder = (id, d) => axios.put(`${S}/orders/${id}`, d).then(r => r.data);
export const deleteSalesOrder = (id) => axios.delete(`${S}/orders/${id}`).then(r => r.data);

// ── Invoices ───────────────────────────────────
export const getInvoices      = (p) => axios.get(`${S}/invoices`, { params: p }).then(r => r.data);
export const createInvoice    = (d) => axios.post(`${S}/invoices`, d).then(r => r.data);
export const updateInvoice    = (id, d) => axios.put(`${S}/invoices/${id}`, d).then(r => r.data);
export const recordPayment    = (id, d) => axios.post(`${S}/invoices/${id}/payment`, d).then(r => r.data);
export const createCreditNote = (id, d) => axios.post(`${S}/invoices/${id}/credit-note`, d).then(r => r.data);
export const getAgingReport   = () => axios.get(`${S}/invoices/aging`).then(r => r.data);

// ── Delivery Orders ────────────────────────────
export const getDeliveryOrders  = (p) => axios.get(`${S}/delivery`, { params: p }).then(r => r.data);
export const createDeliveryOrder= (d) => axios.post(`${S}/delivery`, d).then(r => r.data);
export const updateDeliveryOrder= (id, d) => axios.put(`${S}/delivery/${id}`, d).then(r => r.data);
export const deleteDeliveryOrder= (id) => axios.delete(`${S}/delivery/${id}`).then(r => r.data);

// ── Sales Returns ──────────────────────────────
export const getSalesReturns   = (p) => axios.get(`${S}/returns`, { params: p }).then(r => r.data);
export const createSalesReturn = (d) => axios.post(`${S}/returns`, d).then(r => r.data);
export const approveReturn     = (id, d) => axios.put(`${S}/returns/${id}/approve`, d).then(r => r.data);
export const rejectReturn      = (id, d) => axios.put(`${S}/returns/${id}/reject`, d).then(r => r.data);

// ── Analytics ─────────────────────────────────
export const getSalesAnalytics = (year) => axios.get(`${S}/analytics/summary`, { params: { year } }).then(r => r.data);
