import { api } from './client';

// ── Categories ─────────────────────────────────────────────
export const getCategories = (params = {}) =>
  api.get('/expenses/categories', { params }).then((r) => r.data);

export const createCategory = (data) =>
  api.post('/expenses/categories', data).then((r) => r.data);

export const updateCategory = (id, data) =>
  api.put(`/expenses/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id) =>
  api.delete(`/expenses/categories/${id}`).then((r) => r.data);

// ── Summary / P&L ─────────────────────────────────────────
export const getExpenseSummary = (year) =>
  api.get('/expenses/summary', { params: { year } }).then((r) => r.data);

// ── Recurring ──────────────────────────────────────────────
export const getRecurringCategories = () =>
  api.get('/expenses/recurring').then((r) => r.data);

// ── Expenses ───────────────────────────────────────────────
export const getExpenses = (params = {}) =>
  api.get('/expenses', { params }).then((r) => r.data);

export const createExpense = (data) =>
  api.post('/expenses', data).then((r) => r.data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data).then((r) => r.data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`).then((r) => r.data);

// ── Reimbursements ─────────────────────────────────────────
export const getReimbursements = (params = {}) =>
  api.get('/reimbursements', { params }).then((r) => r.data);

export const createReimbursement = (data) =>
  api.post('/reimbursements', data).then((r) => r.data);

export const approveReimbursement = (id, data = {}) =>
  api.put(`/reimbursements/${id}/approve`, data).then((r) => r.data);

export const rejectReimbursement = (id, data = {}) =>
  api.put(`/reimbursements/${id}/reject`, data).then((r) => r.data);

export const deleteReimbursement = (id) =>
  api.delete(`/reimbursements/${id}`).then((r) => r.data);
