import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecurringCategories, createExpense, getExpenses } from '../api/expenses';

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

const PAGE_SIZE = 8;
const STORAGE_KEY = 'recurring-cost-config-v1';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const defaultConfig = {
  categoryId: '',
  defaultAmount: '',
  frequency: 'monthly',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  reminder: true,
  autoGenerateExpense: false,
  notes: '',
  status: 'active',
};

function addMonths(dateString, months) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function toDisplayDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getNextDueDate(recurringDay) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = parseInt(recurringDay);
  let next = new Date(year, month, day);
  if (next <= now) next = new Date(year, month + 1, day);
  return next.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function frequencyToMonths(freq) {
  if (freq === 'quarterly') return 3;
  if (freq === 'yearly') return 12;
  return 1;
}

function statusBadge(status) {
  if (status === 'inactive') return 'bg-slate-200 text-slate-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function RecurringExpenses() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState('');
  const [configs, setConfigs] = useState({});
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(defaultConfig);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  const loadLocalConfigs = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const persistConfigs = (nextConfigs) => {
    setConfigs(nextConfigs);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfigs));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cats, expenseRows] = await Promise.all([
        getRecurringCategories(),
        getExpenses(),
      ]);

      setCategories(cats);

      const grouped = {};
      (expenseRows || []).forEach((expense) => {
        const categoryId = expense.category?._id || expense.category;
        if (!categoryId) return;
        if (!grouped[categoryId]) grouped[categoryId] = [];
        grouped[categoryId].push(expense);
      });

      Object.keys(grouped).forEach((categoryId) => {
        grouped[categoryId].sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      setExpensesByCategory(grouped);
      setConfigs(loadLocalConfigs());
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categories]);

  const openCreate = () => {
    setEditingId('');
    setForm({
      ...defaultConfig,
      categoryId: categories[0]?._id || '',
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const openEdit = (categoryId) => {
    const cfg = configs[categoryId] || {};
    setEditingId(categoryId);
    setForm({
      ...defaultConfig,
      ...cfg,
      categoryId,
      defaultAmount: cfg.defaultAmount ?? '',
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const validateForm = () => {
    const next = {};
    if (!form.categoryId) next.categoryId = 'Category is required';
    if (!form.defaultAmount || isNaN(form.defaultAmount) || Number(form.defaultAmount) <= 0) {
      next.defaultAmount = 'Enter a valid default amount';
    }
    if (!form.startDate) next.startDate = 'Start date is required';
    if (form.endDate && form.endDate < form.startDate) {
      next.endDate = 'End date cannot be before start date';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveConfig = () => {
    setError('');
    if (!validateForm()) {
      setError('Please resolve form errors before saving');
      return;
    }

    const categoryId = form.categoryId;
    const nextConfigs = {
      ...configs,
      [categoryId]: {
        ...form,
        defaultAmount: Number(form.defaultAmount),
      },
    };
    persistConfigs(nextConfigs);
    setShowModal(false);
  };

  const toggleStatus = (categoryId) => {
    const cfg = configs[categoryId] || {};
    const nextConfigs = {
      ...configs,
      [categoryId]: {
        ...defaultConfig,
        ...cfg,
        categoryId,
        status: cfg.status === 'inactive' ? 'active' : 'inactive',
      },
    };
    persistConfigs(nextConfigs);
  };

  const handleMarkPaid = async (cat) => {
    const config = configs[cat._id] || {};
    const amount = Number(config.defaultAmount || 0);
    if (!amount || amount <= 0) {
      setError('Add a recurring cost configuration with a valid default amount first');
      return;
    }

    setMarkingId(cat._id);
    setError('');

    try {
      await createExpense({
        category: cat._id,
        amount,
        date: new Date().toISOString(),
        description: `Recurring payment – ${cat.name} || ${(config.notes || '').trim()}`,
        paymentMethod: 'bank_transfer',
        isRecurring: true,
        recurringMonth: new Date().getMonth() + 1,
      });

      await load();
    } catch { setError('Failed to record payment'); }
    finally { setMarkingId(null); }
  };

  const rows = categories
    .map((category) => {
      const cfg = configs[category._id] || { ...defaultConfig, categoryId: category._id };
      const lastRecorded = expensesByCategory[category._id]?.[0] || null;

      const nextDueDate = cfg.startDate
        ? addMonths(lastRecorded?.date ? new Date(lastRecorded.date).toISOString().slice(0, 10) : cfg.startDate, frequencyToMonths(cfg.frequency || 'monthly'))
        : category.recurringDay
          ? new Date(new Date().getFullYear(), new Date().getMonth(), Number(category.recurringDay || 1)).toISOString().slice(0, 10)
          : '';

      return {
        category,
        config: cfg,
        lastRecorded,
        nextDueDate,
      };
    })
    .filter((row) => {
      const q = search.trim().toLowerCase();
      const status = row.config.status || 'active';
      const text = `${row.category.name} ${row.category.type} ${row.config.notes || ''}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesStatus = !statusFilter || status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recurring Costs</h1>
          <p className="text-slate-500 text-sm">Manage fixed recurring costs and quickly post the next due entries.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <i className="bi bi-plus-lg" /> Create Recurring Cost
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Search recurring costs</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category, type, notes..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading recurring expenses…</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <i className="bi bi-arrow-repeat text-5xl block mb-3 opacity-20" />
          <p className="font-medium">No recurring categories are configured yet.</p>
          <p className="text-sm mt-1">Set a category as recurring first, then create its recurring cost profile.</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/expenses/categories')}
              className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
            >
              Go to Categories
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Recurring Cost
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="bi bi-inbox text-5xl block mb-3 opacity-20" />
              No recurring costs match current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Category Name</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Frequency</th>
                      <th className="px-4 py-3 text-left font-medium">Next Due Date</th>
                      <th className="px-4 py-3 text-left font-medium">Last Recorded Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((row) => (
                      <tr key={row.category._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{row.category.name}</p>
                          <p className="text-xs text-slate-500">Type: {row.category.type} · Due day: {row.category.recurringDay || '—'}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {row.config.defaultAmount ? formatLKR(row.config.defaultAmount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{(row.config.frequency || 'monthly').charAt(0).toUpperCase() + (row.config.frequency || 'monthly').slice(1)}</td>
                        <td className="px-4 py-3 text-slate-700">{toDisplayDate(row.nextDueDate) || getNextDueDate(row.category.recurringDay)}</td>
                        <td className="px-4 py-3 text-slate-700">{toDisplayDate(row.lastRecorded?.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(row.config.status || 'active')}`}>
                            {(row.config.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(row.category._id)}
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                            >
                              Configure
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(row.category)}
                              disabled={markingId === row.category._id || (row.config.status || 'active') === 'inactive'}
                              className="px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {markingId === row.category._id ? 'Recording...' : 'Record Expense'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(row.category._id)}
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                            >
                              {(row.config.status || 'active') === 'inactive' ? 'Activate' : 'Deactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-slate-600">Showing {rangeStart}–{rangeEnd} of {totalRecords} recurring costs</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit' : 'Create'} Recurring Cost</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  disabled={!!editingId}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {fieldErrors.categoryId && <p className="text-xs text-red-600 mt-1">{fieldErrors.categoryId}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Amount *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.defaultAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, defaultAmount: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                  {fieldErrors.defaultAmount && <p className="text-xs text-red-600 mt-1">{fieldErrors.defaultAmount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {fieldErrors.startDate && <p className="text-xs text-red-600 mt-1">{fieldErrors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {fieldErrors.endDate && <p className="text-xs text-red-600 mt-1">{fieldErrors.endDate}</p>}
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.reminder}
                    onChange={(e) => setForm((prev) => ({ ...prev, reminder: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Reminder toggle</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.autoGenerateExpense}
                    onChange={(e) => setForm((prev) => ({ ...prev, autoGenerateExpense: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Auto-generate expense toggle</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Optional notes for this recurring cost"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={saveConfig} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Recurring Cost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
