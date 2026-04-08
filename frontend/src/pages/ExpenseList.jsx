import { useState, useEffect, useRef } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, createCategory } from '../api/expenses';

const PM_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', credit_card: 'Credit Card' };
const PM_COLORS = { cash: 'bg-emerald-100 text-emerald-700', bank_transfer: 'bg-blue-100 text-blue-700', credit_card: 'bg-purple-100 text-purple-700' };
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS = {
  recorded: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const LABEL_CLASS = 'block text-xs font-semibold tracking-wide text-slate-600 mb-1.5';
const CONTROL_CLASS = 'h-10 w-full border border-slate-300/90 bg-white rounded-xl px-3 text-sm text-slate-700 shadow-sm shadow-slate-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition';
const HEADER_SECONDARY_BTN = 'h-10 px-4 inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition';
const HEADER_PRIMARY_BTN = 'h-10 px-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200/70 transition';
const TABLE_ICON_BTN = 'p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition';

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

function formatExpenseId(expense, index = 0) {
  if (!expense?._id) return `EXP-${String(index + 1).padStart(4, '0')}`;
  return `EXP-${expense._id.slice(-6).toUpperCase()}`;
}

function titleCase(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitDescription(description = '') {
  const [title, ...rest] = String(description).split('||');
  return {
    title: title?.trim() || '',
    notes: rest.join('||').trim(),
  };
}

function buildDescription(title, notes) {
  const t = (title || '').trim();
  const n = (notes || '').trim();
  if (!t) return n;
  if (!n) return t;
  return `${t} || ${n}`;
}

function categoryNameById(categories, id) {
  return categories.find((c) => c._id === id)?.name || '—';
}

const emptyForm = {
  expenseId: '',
  title: '',
  amount: '',
  category: '',
  subCategory: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  vendorName: '',
  approvedBy: '',
  receiptUrl: '',
  notes: '',
  status: 'recorded',
  isPettyCash: false,
  isRecurring: false,
};

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    paymentMethod: '',
    vendor: '',
    status: '',
    fromDate: '',
    toDate: '',
    isPettyCash: '',
  });

  const [page, setPage] = useState(1);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([getExpenses(), getCategories()]);
      setExpenses(exp);
      setCategories(cats);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const openEdit = (e) => {
    const details = splitDescription(e.description || '');
    const isSub = !!e.category?.parentCategory;
    setEditing(e._id);
    setForm({
      expenseId: formatExpenseId(e),
      title: details.title,
      amount: e.amount,
      category: isSub ? (e.category.parentCategory?._id || e.category.parentCategory || '') : (e.category?._id || ''),
      subCategory: isSub ? e.category?._id || '' : '',
      date: new Date(e.date).toISOString().slice(0, 10),
      paymentMethod: e.paymentMethod,
      vendorName: e.vendorName || '',
      approvedBy: e.approvedBy || '',
      receiptUrl: e.receiptUrl || '',
      notes: details.notes,
      status: e.status || 'recorded',
      isPettyCash: !!e.isPettyCash,
      isRecurring: e.isRecurring,
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({...f, receiptUrl: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const onFormFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Expense title is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) nextErrors.amount = 'Enter a valid amount';
    if (!form.category) nextErrors.category = 'Category is required';
    if (!form.date) nextErrors.date = 'Date is required';
    if (!form.paymentMethod) nextErrors.paymentMethod = 'Payment method is required';
    if (!form.status) nextErrors.status = 'Status is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    setError('');
    if (!validateForm()) {
      setError('Please resolve form errors before saving');
      return;
    }

    const selectedCategoryId = form.subCategory || form.category;
    setSaving(true);
    try {
      const payload = {
        category: selectedCategoryId,
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        vendorName: form.vendorName,
        receiptUrl: form.receiptUrl,
        isPettyCash: !!form.isPettyCash,
        isRecurring: !!form.isRecurring,
        description: buildDescription(form.title, form.notes),
        approvedBy: form.approvedBy,
        status: form.status,
      };

      if (editing) await updateExpense(editing, payload);
      else await createExpense(payload);
      setShowModal(false);
      setFieldErrors({});
      await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(id); await load(); } catch { }
  };

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const resp = await createCategory({ name: newCatName, type: 'other' });
      setCategories(prev => [...prev, resp].sort((a,b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, category: resp._id, subCategory: '' }));
      setShowCatForm(false);
      setNewCatName('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const masterCategories = categories.filter((c) => !c.parentCategory);
  const subCategories = categories.filter((c) => c.parentCategory);

  const availableSubCategories = subCategories.filter((c) => {
    const parentId = c.parentCategory?._id || c.parentCategory;
    return !form.category || parentId === form.category;
  });

  const q = search.trim().toLowerCase();
  const filtered = expenses.filter((expense) => {
    const categoryId = expense.category?._id || '';
    const categoryObj = categories.find((c) => c._id === categoryId);
    const isSubCategory = !!categoryObj?.parentCategory;
    const masterId = isSubCategory ? (categoryObj.parentCategory?._id || categoryObj.parentCategory || '') : categoryId;
    const subId = isSubCategory ? categoryId : '';
    const status = expense.status || 'recorded';
    const vendor = (expense.vendorName || '').toLowerCase();
    const title = splitDescription(expense.description || '').title.toLowerCase();
    const notes = splitDescription(expense.description || '').notes.toLowerCase();
    const categoryName = categoryNameById(categories, masterId).toLowerCase();
    const subName = categoryNameById(categories, subId).toLowerCase();
    const text = `${title} ${notes} ${vendor} ${categoryName} ${subName}`;

    const dateStr = new Date(expense.date).toISOString().slice(0, 10);

    const matchesSearch = !q || text.includes(q) || formatExpenseId(expense).toLowerCase().includes(q);
    const matchesCategory = !filters.category || masterId === filters.category;
    const matchesSubCategory = !filters.subCategory || subId === filters.subCategory;
    const matchesMethod = !filters.paymentMethod || expense.paymentMethod === filters.paymentMethod;
    const matchesVendor = !filters.vendor || vendor.includes(filters.vendor.toLowerCase());
    const matchesStatus = !filters.status || status === filters.status;
    const matchesFrom = !filters.fromDate || dateStr >= filters.fromDate;
    const matchesTo = !filters.toDate || dateStr <= filters.toDate;
    const matchesPetty = !filters.isPettyCash || String(!!expense.isPettyCash) === filters.isPettyCash;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubCategory &&
      matchesMethod &&
      matchesVendor &&
      matchesStatus &&
      matchesFrom &&
      matchesTo &&
      matchesPetty
    );
  });

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const exportFilteredExpenses = () => {
    if (!filtered.length) return;

    const headers = [
      'Expense ID',
      'Date',
      'Category',
      'Sub-category',
      'Vendor/Payee',
      'Amount',
      'Payment Method',
      'Status',
      'Title',
      'Notes',
    ];

    const rows = filtered.map((expense) => {
      const categoryId = expense.category?._id || '';
      const categoryObj = categories.find((c) => c._id === categoryId);
      const isSubCategory = !!categoryObj?.parentCategory;
      const masterId = isSubCategory ? (categoryObj.parentCategory?._id || categoryObj.parentCategory || '') : categoryId;
      const subId = isSubCategory ? categoryId : '';
      const details = splitDescription(expense.description || '');

      return [
        formatExpenseId(expense),
        new Date(expense.date).toISOString().slice(0, 10),
        categoryNameById(categories, masterId),
        categoryNameById(categories, subId),
        expense.vendorName || '',
        Number(expense.amount || 0).toFixed(2),
        PM_LABELS[expense.paymentMethod] || expense.paymentMethod,
        titleCase(expense.status || 'recorded'),
        details.title,
        details.notes,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const selectedFilterCategorySubs = subCategories.filter((c) => {
    const parentId = c.parentCategory?._id || c.parentCategory;
    return !filters.category || parentId === filters.category;
  });

  const resetFilters = () => {
    setSearch('');
    setFilters({
      category: '',
      subCategory: '',
      paymentMethod: '',
      vendor: '',
      status: '',
      fromDate: '',
      toDate: '',
      isPettyCash: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">All Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track, filter, and manage operational expense records in one place.</p>
        </div>
        <div className="flex items-center gap-2 self-end">
          <button
            onClick={exportFilteredExpenses}
            disabled={!filtered.length}
            className={HEADER_SECONDARY_BTN}
          >
            <i className="bi bi-download" /> Export
          </button>
          <button onClick={openAdd}
            className={HEADER_PRIMARY_BTN}>
            <i className="bi bi-plus-lg" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 px-5 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div className="xl:col-span-2">
            <label className={LABEL_CLASS}>Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by expense ID, title, notes, vendor..."
              className={CONTROL_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, subCategory: '' }))}
              className={CONTROL_CLASS}
            >
              <option value="">All categories</option>
              {masterCategories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Sub-category</label>
            <select
              value={filters.subCategory}
              onChange={(e) => setFilters((prev) => ({ ...prev, subCategory: e.target.value }))}
              className={CONTROL_CLASS}
            >
              <option value="">All sub-categories</option>
              {selectedFilterCategorySubs.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className={CONTROL_CLASS}
            >
              <option value="">All payment methods</option>
              {Object.entries(PM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Vendor / Payee</label>
            <input
              value={filters.vendor}
              onChange={(e) => setFilters((prev) => ({ ...prev, vendor: e.target.value }))}
              placeholder="Filter vendor"
              className={CONTROL_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className={CONTROL_CLASS}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Date From</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              className={CONTROL_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Date To</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
              className={CONTROL_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Cash Type</label>
            <select
              value={filters.isPettyCash}
              onChange={(e) => setFilters((prev) => ({ ...prev, isPettyCash: e.target.value }))}
              className={CONTROL_CLASS}
            >
              <option value="">All types</option>
              <option value="true">Petty Cash</option>
              <option value="false">Non-Petty Cash</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl px-3.5 py-2.5">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700">
              <i className="bi bi-currency-dollar text-xs" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide font-semibold text-indigo-600">Filtered Total</p>
              <p className="text-sm font-semibold text-indigo-900 leading-tight">{formatLKR(total)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-4 inline-flex items-center justify-center text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-14 text-center text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center text-slate-400">
            <i className="bi bi-receipt text-4xl block mb-3 opacity-30" />
            No expenses match current filters. Try broadening your filters or add a new expense.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-sm">
                <thead className="bg-slate-50/80 text-[11px] text-slate-500 uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    {['Expense ID','Date','Category','Sub-category','Vendor / Payee','Amount','Payment Method','Status','Receipt','Actions'].map(h=>(
                      <th key={h} className="px-4 py-3.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginated.map((e, index) => {
                    const categoryId = e.category?._id || '';
                    const categoryObj = categories.find((c) => c._id === categoryId);
                    const isSubCategory = !!categoryObj?.parentCategory;
                    const masterId = isSubCategory ? (categoryObj.parentCategory?._id || categoryObj.parentCategory || '') : categoryId;
                    const subId = isSubCategory ? categoryId : '';
                    const status = e.status || 'recorded';

                    return (
                      <tr key={e._id} className="group align-middle hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">{formatExpenseId(e, index)}</td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3.5 text-slate-700">{categoryNameById(categories, masterId)}</td>
                        <td className="px-4 py-3.5 text-slate-500">{categoryNameById(categories, subId)}</td>
                        <td className="px-4 py-3.5 text-slate-700">{e.vendorName || '—'}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{formatLKR(e.amount)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PM_COLORS[e.paymentMethod] || 'bg-slate-100 text-slate-700'}`}>
                            {PM_LABELS[e.paymentMethod] || e.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'}`}>
                            {titleCase(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {e.receiptUrl ? (
                            <a href={e.receiptUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-100 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/70 text-xs font-medium transition">
                              <i className="bi bi-paperclip" /> View
                            </a>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(e)}
                              className={`${TABLE_ICON_BTN} hover:text-indigo-600 hover:bg-indigo-50`}>
                              <i className="bi bi-pencil text-sm" />
                            </button>
                            <button onClick={() => handleDelete(e._id)}
                              className={`${TABLE_ICON_BTN} hover:text-red-600 hover:bg-red-50`}>
                              <i className="bi bi-trash text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
              <p className="text-sm text-slate-600 font-medium">
                Showing {rangeStart}–{rangeEnd} of {totalRecords} expenses
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600 px-2">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit' : 'New'} Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense ID</label>
                <input
                  value={editing ? form.expenseId : 'Auto-generated on save'}
                  readOnly
                  className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Category *</label>
                    <button type="button" onClick={() => setShowCatForm(!showCatForm)}
                      className="text-xs text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <i className={`bi ${showCatForm ? 'bi-dash-lg' : 'bi-plus-lg'}`} /> {showCatForm ? 'Cancel' : 'New'}
                    </button>
                  </div>
                  {showCatForm ? (
                    <div className="flex gap-2">
                      <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                        className="flex-1 border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="New category name" autoFocus />
                      <button type="button" onClick={handleQuickAddCategory} disabled={!newCatName.trim() || saving}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        Add
                      </button>
                    </div>
                  ) : (
                    <select value={form.category} onChange={e => onFormFieldChange('category', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                      <option value="">Select…</option>
                      {masterCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                  {fieldErrors.category && <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title / Purpose *</label>
                  <input value={form.title} onChange={e => onFormFieldChange('title', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Courier charge for trim samples" />
                  {fieldErrors.title && <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-category</label>
                  <select
                    value={form.subCategory}
                    onChange={(e) => onFormFieldChange('subCategory', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    {availableSubCategories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" min="0" value={form.amount} onChange={e => onFormFieldChange('amount', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00" />
                  {fieldErrors.amount && <p className="text-xs text-red-600 mt-1">{fieldErrors.amount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => onFormFieldChange('date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {fieldErrors.date && <p className="text-xs text-red-600 mt-1">{fieldErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => onFormFieldChange('paymentMethod', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {Object.entries(PM_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {fieldErrors.paymentMethod && <p className="text-xs text-red-600 mt-1">{fieldErrors.paymentMethod}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Service Provider</label>
                <input value={form.vendorName} onChange={e => onFormFieldChange('vendorName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Vendor or landlord name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Approved By</label>
                  <input
                    value={form.approvedBy}
                    onChange={(e) => onFormFieldChange('approvedBy', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Manager / Supervisor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => onFormFieldChange('status', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  {fieldErrors.status && <p className="text-xs text-red-600 mt-1">{fieldErrors.status}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Description</label>
                <textarea value={form.notes} onChange={e => onFormFieldChange('notes', e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Brief description…" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Attachment</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileRef.current.click()}>
                  {form.receiptUrl ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                      <i className="bi bi-check-circle-fill text-emerald-500" />
                      <span className="text-sm">Receipt attached</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setForm(f=>({...f, receiptUrl: ''})); }}
                        className="ml-2 text-slate-400 hover:text-red-500"><i className="bi bi-x" /></button>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <i className="bi bi-cloud-upload text-2xl block mb-1" />
                      <span className="text-sm">Click to upload receipt photo</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 bg-slate-50 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPettyCash} onChange={e => onFormFieldChange('isPettyCash', e.target.checked)}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-medium text-slate-700">Petty Cash</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isRecurring} onChange={e => onFormFieldChange('isRecurring', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Recurring Entry</span>
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}
                {editing ? 'Update' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
