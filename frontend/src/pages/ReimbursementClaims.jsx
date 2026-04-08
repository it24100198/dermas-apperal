import { useState, useEffect, useRef } from 'react';
import {
  getReimbursements, createReimbursement,
  approveReimbursement, rejectReimbursement, deleteReimbursement,
} from '../api/expenses';

const TYPE_OPTS = [
  { value: 'travel', label: 'Travel', icon: 'bi-car-front-fill' },
  { value: 'meal', label: 'Meal', icon: 'bi-cup-hot-fill' },
  { value: 'other', label: 'Other', icon: 'bi-three-dots' },
];

const STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_ICONS = { pending: 'bi-hourglass-split', approved: 'bi-check-circle-fill', rejected: 'bi-x-circle-fill' };
const PAGE_SIZE = 10;

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

function formatClaimId(claim, index = 0) {
  if (claim?.claimId) return claim.claimId;
  if (!claim?._id) return `CLM-${String(index + 1).padStart(4, '0')}`;
  return `CLM-${claim._id.slice(-6).toUpperCase()}`;
}

function titleCase(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const emptyForm = {
  claimId: '',
  employeeName: '',
  type: 'travel',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  description: '',
  receiptUrl: '',
  paymentMethod: '',
  submittedDate: new Date().toISOString().slice(0, 10),
  status: 'pending',
};

export default function ReimbursementClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    employeeName: '',
    claimType: '',
    date: '',
    status: '',
    minAmount: '',
    maxAmount: '',
  });
  const [page, setPage] = useState(1);

  const [reviewModal, setReviewModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      setClaims(await getReimbursements());
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, filters]);

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
    if (!form.employeeName.trim()) nextErrors.employeeName = 'Employee name is required';
    if (!form.type) nextErrors.type = 'Claim type is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) nextErrors.amount = 'Enter a valid amount';
    if (!form.expenseDate) nextErrors.expenseDate = 'Expense date is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateForm()) {
      setError('Please resolve form errors before submitting');
      return;
    }

    setSaving(true);
    try {
      await createReimbursement({
        claimId: form.claimId,
        employeeName: form.employeeName.trim(),
        type: form.type,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        description: form.description.trim(),
        receiptUrl: form.receiptUrl,
        paymentMethod: form.paymentMethod,
        submittedDate: form.submittedDate,
        status: 'pending',
      });
      setShowModal(false);
      setForm(emptyForm);
      setFieldErrors({});
      setTab('pending');
      await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed to submit'); }
    finally { setSaving(false); }
  };

  const openReview = (id, action) => { setReviewModal({ id, action }); setReviewNote(''); };
  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      const fn = reviewModal.action === 'approve' ? approveReimbursement : rejectReimbursement;
      await fn(reviewModal.id, { reviewNote });
      setReviewModal(null);
      await load();
    } catch { }
    finally { setReviewing(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this claim?')) return;
    try { await deleteReimbursement(id); await load(); } catch { }
  };

  const tabCounts = {
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    rejected: claims.filter((c) => c.status === 'rejected').length,
    all: claims.length,
  };

  const pendingCount = tabCounts.pending;
  const totalPending = claims.filter(c=>c.status==='pending').reduce((s,c)=>s+c.amount,0);

  const q = search.trim().toLowerCase();

  const filteredClaims = claims.filter((claim) => {
    const tabMatch = tab === 'all' || claim.status === tab;
    const text = `${formatClaimId(claim)} ${claim.employeeName || ''} ${claim.description || ''}`.toLowerCase();
    const claimDate = new Date(claim.expenseDate || claim.createdAt).toISOString().slice(0, 10);
    const amount = Number(claim.amount || 0);

    const matchesSearch = !q || text.includes(q);
    const matchesEmployee = !filters.employeeName || (claim.employeeName || '').toLowerCase().includes(filters.employeeName.toLowerCase());
    const matchesType = !filters.claimType || claim.type === filters.claimType;
    const matchesDate = !filters.date || claimDate === filters.date;
    const matchesStatus = !filters.status || claim.status === filters.status;
    const matchesMin = !filters.minAmount || amount >= Number(filters.minAmount);
    const matchesMax = !filters.maxAmount || amount <= Number(filters.maxAmount);

    return tabMatch && matchesSearch && matchesEmployee && matchesType && matchesDate && matchesStatus && matchesMin && matchesMax;
  });

  const totalRecords = filteredClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedClaims = filteredClaims.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const resetFilters = () => {
    setSearch('');
    setFilters({
      employeeName: '',
      claimType: '',
      date: '',
      status: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reimbursement Claims</h1>
          <p className="text-slate-500 text-sm">Employee expense claim submission and approval</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setFieldErrors({}); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> Submit Claim
        </button>
      </div>

      {tab === 'pending' && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <i className="bi bi-hourglass-split text-amber-500 text-2xl" />
          <div>
            <p className="font-semibold text-amber-800">{pendingCount} claim{pendingCount>1?'s':''} pending approval</p>
            <p className="text-amber-600 text-sm">Total: {formatLKR(totalPending)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label} <span className="text-xs ml-1 text-slate-500">({tabCounts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <div className="xl:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Search claims</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by claim ID, employee, description..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Employee Name</label>
            <input
              value={filters.employeeName}
              onChange={(e) => setFilters((prev) => ({ ...prev, employeeName: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Filter employee"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Claim Type</label>
            <select
              value={filters.claimType}
              onChange={(e) => setFilters((prev) => ({ ...prev, claimType: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All claim types</option>
              {TYPE_OPTS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Min Amount</label>
            <input
              type="number"
              min="0"
              value={filters.minAmount}
              onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max Amount</label>
            <input
              type="number"
              min="0"
              value={filters.maxAmount}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading…</div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <i className="bi bi-inbox text-5xl block mb-3 opacity-20" />
          No {tab !== 'all' ? tab : ''} claims found for the current filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1260px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  {['Claim ID','Employee Name','Claim Type','Date','Amount','Description','Receipt','Status','Approved By','Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClaims.map((claim, index) => (
                  <tr key={claim._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{formatClaimId(claim, index)}</td>
                    <td className="px-4 py-3 text-slate-700">{claim.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700">{TYPE_OPTS.find((type) => type.value === claim.type)?.label || claim.type}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{new Date(claim.expenseDate || claim.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{formatLKR(claim.amount)}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate" title={claim.description}>{claim.description}</td>
                    <td className="px-4 py-3">
                      {claim.receiptUrl ? (
                        <a
                          href={claim.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <i className="bi bi-paperclip" /> View
                        </a>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${STATUS_COLORS[claim.status]}`}>
                        <i className={`bi ${STATUS_ICONS[claim.status]}`} />
                        {titleCase(claim.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{claim.reviewedBy?.name || claim.approvedBy || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {claim.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openReview(claim._id, 'approve')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Approve"
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                            <button
                              onClick={() => openReview(claim._id, 'reject')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(claim._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <i className="bi bi-trash text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-600">Showing {rangeStart}–{rangeEnd} of {totalRecords} claims</p>
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
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Submit Reimbursement Claim</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Claim ID (optional)</label>
                  <input
                    value={form.claimId}
                    onChange={(e) => onFormFieldChange('claimId', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Auto-generated if left blank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Submitted Date</label>
                  <input
                    type="date"
                    value={form.submittedDate}
                    onChange={(e) => onFormFieldChange('submittedDate', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name *</label>
                <input value={form.employeeName} onChange={e=>onFormFieldChange('employeeName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name" />
                {fieldErrors.employeeName && <p className="text-xs text-red-600 mt-1">{fieldErrors.employeeName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" min="0" value={form.amount} onChange={e=>onFormFieldChange('amount', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00" />
                  {fieldErrors.amount && <p className="text-xs text-red-600 mt-1">{fieldErrors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Claim Type *</label>
                  <select value={form.type} onChange={e=>onFormFieldChange('type', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TYPE_OPTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {fieldErrors.type && <p className="text-xs text-red-600 mt-1">{fieldErrors.type}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => onFormFieldChange('expenseDate', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  {fieldErrors.expenseDate && <p className="text-xs text-red-600 mt-1">{fieldErrors.expenseDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method (optional)</label>
                  <input
                    value={form.paymentMethod}
                    onChange={(e) => onFormFieldChange('paymentMethod', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Cash, transfer, card..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={e=>onFormFieldChange('description', e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe the expense (e.g., Taxi to supplier meeting on 28 March)" />
                {fieldErrors.description && <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt (optional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => fileRef.current.click()}>
                  {form.receiptUrl ? (
                    <span className="text-emerald-600 text-sm flex items-center justify-center gap-2">
                      <i className="bi bi-check-circle-fill" /> Receipt attached
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm"><i className="bi bi-upload mr-2" />Upload receipt</span>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <input
                  value="Pending"
                  readOnly
                  className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />} Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className={`px-6 py-4 rounded-t-2xl ${reviewModal.action==='approve' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
              <h3 className="font-semibold text-lg">
                {reviewModal.action === 'approve' ? '✓ Approve Claim' : '✗ Reject Claim'}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Review Note (optional)</label>
              <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add a note for the employee…" />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleReview} disabled={reviewing}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 ${reviewModal.action==='approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {reviewing && <i className="bi bi-arrow-repeat animate-spin" />}
                {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
