import axios from 'axios';

const BASE = String(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

// ── Categories ─────────────────────────────────────────────
export const getCategories = (params = {}) =>
  axios.get(`${BASE}/expenses/categories`, { params }).then((r) => r.data);

export const createCategory = (data) =>
  axios.post(`${BASE}/expenses/categories`, data).then((r) => r.data);

export const updateCategory = (id, data) =>
  axios.put(`${BASE}/expenses/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id) =>
  axios.delete(`${BASE}/expenses/categories/${id}`).then((r) => r.data);

// ── Summary / P&L ─────────────────────────────────────────
export const getExpenseSummary = (year) =>
  axios.get(`${BASE}/expenses/summary`, { params: { year } }).then((r) => r.data);

// ── Recurring ──────────────────────────────────────────────
export const getRecurringCategories = () =>
  axios.get(`${BASE}/expenses/recurring`).then((r) => r.data);

// ── Expenses ───────────────────────────────────────────────
export const getExpenses = (params = {}) =>
  axios.get(`${BASE}/expenses`, { params }).then((r) => r.data);

export const createExpense = (data) =>
  axios.post(`${BASE}/expenses`, data).then((r) => r.data);

export const updateExpense = (id, data) =>
  axios.put(`${BASE}/expenses/${id}`, data).then((r) => r.data);

export const deleteExpense = (id) =>
  axios.delete(`${BASE}/expenses/${id}`).then((r) => r.data);

// ── Reimbursements ─────────────────────────────────────────
export const getReimbursements = (params = {}) =>
  axios.get(`${BASE}/reimbursements`, { params }).then((r) => r.data);

export const createReimbursement = (data) =>
  axios.post(`${BASE}/reimbursements`, data).then((r) => r.data);

export const approveReimbursement = (id, data = {}) =>
  axios.put(`${BASE}/reimbursements/${id}/approve`, data).then((r) => r.data);

export const rejectReimbursement = (id, data = {}) =>
  axios.put(`${BASE}/reimbursements/${id}/reject`, data).then((r) => r.data);

export const deleteReimbursement = (id) =>
  axios.delete(`${BASE}/reimbursements/${id}`).then((r) => r.data);
