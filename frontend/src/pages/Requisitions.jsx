import { useEffect, useState } from 'react';
import {
  getRequisitionsList,
  createRequisition,
  approveRequisition,
  rejectRequisition,
  getMaterials,
  getSuppliers,
} from '../api/purchase';
import { downloadCsv } from '../utils/csvExport';

const URGENCY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const emptyForm = {
  requestedBy: '',
  section: '',
  urgency: 'medium',
  notes: '',
  items: [{ material: '', qty: 1, note: '' }],
};

const PAGE_SIZE = 8;

const buildRequisitionCode = (requisition, index) => {
  const fallback = String(index + 1).padStart(4, '0');
  const suffix = requisition?._id ? requisition._id.slice(-6).toUpperCase() : fallback;
  return `REQ-${suffix}`;
};

export default function Requisitions() {
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ approvedBy: '', approvalNote: '', supplierId: '', expectedDeliveryDate: '' });
  const [reviewing, setReviewing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [detailReq, setDetailReq] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = { page: nextPage, pageSize: PAGE_SIZE };
      if (tab !== 'all') params.status = tab;
      if (urgencyFilter !== 'all') params.urgency = urgencyFilter;
      if (search.trim()) params.search = search.trim();

      const [r, m, s, countPending, countApproved, countRejected, countAll] = await Promise.all([
        getRequisitionsList(params),
        getMaterials(),
        getSuppliers(),
        getRequisitionsList({ status: 'pending', page: 1, pageSize: 1 }),
        getRequisitionsList({ status: 'approved', page: 1, pageSize: 1 }),
        getRequisitionsList({ status: 'rejected', page: 1, pageSize: 1 }),
        getRequisitionsList({ page: 1, pageSize: 1 }),
      ]);

      setRows(r.items || []);
      setTotal(r.total || 0);
      setTotalPages(r.totalPages || 1);
      setPage(r.page || nextPage);
      setMaterials(m);
      setSuppliers(s);
      setCounts({
        pending: countPending.total || 0,
        approved: countApproved.total || 0,
        rejected: countRejected.total || 0,
        all: countAll.total || 0,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Unable to load requisitions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, urgencyFilter]);

  useEffect(() => {
    load(page);
  }, [page, tab, search, urgencyFilter]);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { material: '', qty: 1, note: '' }] }));

  const removeItem = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== index) }));

  const updateItem = (index, field, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.requestedBy.trim()) nextErrors.requestedBy = 'Requested by is required.';
    if (!form.section.trim()) nextErrors.section = 'Section is required.';

    form.items.forEach((item, idx) => {
      if (!item.material) nextErrors[`material-${idx}`] = 'Select a material.';
      if (Number(item.qty) <= 0) nextErrors[`qty-${idx}`] = 'Qty must be at least 1.';
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setFormError('Please fix highlighted fields before submitting.');
      return;
    }

    setSaving(true);
    try {
      await createRequisition({
        requestedBy: form.requestedBy.trim(),
        section: form.section.trim(),
        urgency: form.urgency,
        items: form.items.map((item) => ({ material: item.material, qty: Number(item.qty), note: item.note?.trim() || '' })),
        approvalNote: form.notes.trim(),
      });

      setShowModal(false);
      setForm(emptyForm);
      setFeedback({ type: 'success', message: 'Requisition submitted successfully.' });
      await load(page);
      setTab('pending');
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Failed to submit requisition.');
    } finally {
      setSaving(false);
    }
  };

  const openReview = (id, action) => {
    setReviewModal({ id, action });
    setReviewForm({ approvedBy: '', approvalNote: '', supplierId: '', expectedDeliveryDate: '' });
    setFormError('');
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    if (reviewModal.action === 'approve' && !reviewForm.supplierId) {
      setFormError('Select a supplier before approval.');
      return;
    }

    setReviewing(true);
    try {
      if (reviewModal.action === 'approve') {
        await approveRequisition(reviewModal.id, reviewForm);
        setFeedback({ type: 'success', message: 'Requisition approved and PO created.' });
      } else {
        await rejectRequisition(reviewModal.id, reviewForm);
        setFeedback({ type: 'success', message: 'Requisition rejected.' });
      }
      setReviewModal(null);
      await load(page);
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Review action failed.');
    } finally {
      setReviewing(false);
    }
  };

  const exportCsv = () => {
    downloadCsv({
      fileName: 'requisitions-export.csv',
      columns: [
        { header: 'Requisition ID', accessor: (r) => buildRequisitionCode(r, 0) },
        { header: 'Requested By', accessor: (r) => r.requestedBy },
        { header: 'Section', accessor: (r) => r.section },
        { header: 'Date', accessor: (r) => new Date(r.createdAt).toLocaleDateString('en-GB') },
        { header: 'Urgency', accessor: (r) => r.urgency },
        { header: 'Item Count', accessor: (r) => r.items?.length || 0 },
        { header: 'Status', accessor: (r) => r.status },
        { header: 'Approved By', accessor: (r) => r.approvedBy || '-' },
      ],
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Requisitions</h1>
          <p className="text-slate-500 text-sm">Create, review and convert internal requests into purchase orders</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setFieldErrors({}); setFormError(''); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New Requisition
        </button>
      </div>

      {feedback.message && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="opacity-70 hover:opacity-100"><i className="bi bi-x-lg" /></button>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {['pending', 'approved', 'rejected', 'all'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4 flex justify-end">
            <button onClick={exportCsv} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <i className="bi bi-download" /> Export CSV
            </button>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by requisition ID, requester, section or approver" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Urgency</label>
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="bi bi-clipboard-plus text-5xl block mb-3 opacity-20" />
            <p className="mb-3">No requisitions found for this view.</p>
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create Requisition</button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  {['Requisition ID', 'Requested By', 'Section', 'Date', 'Urgency', 'Item Count', 'Status', 'Approved By', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">{buildRequisitionCode(r, (page - 1) * PAGE_SIZE + idx)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.requestedBy}</td>
                    <td className="px-4 py-3 text-slate-600">{r.section}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[r.urgency]}`}>{r.urgency}</span></td>
                    <td className="px-4 py-3 text-slate-600">{r.items?.length || 0}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-slate-600">{r.approvedBy || '-'}</td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setDetailReq(r)} className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100">View</button>
                          <button onClick={() => openReview(r._id, 'approve')} className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Approve</button>
                          <button onClick={() => openReview(r._id, 'reject')} className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setDetailReq(r)} className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100">View</button>
                          <span className="text-xs text-slate-400 self-center">{r.linkedPO?.poNumber ? `PO: ${r.linkedPO.poNumber}` : '-'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <p className="text-slate-500">Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} requisitions</p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Previous</button>
                <span className="text-slate-600">Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">New Purchase Requisition</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requested By *</label>
                  <input value={form.requestedBy} onChange={(e) => setForm((f) => ({ ...f, requestedBy: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.requestedBy ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                  {fieldErrors.requestedBy && <p className="text-xs text-red-600 mt-1">{fieldErrors.requestedBy}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section *</label>
                  <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.section ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} placeholder="e.g. Cutting, Washing" />
                  {fieldErrors.section && <p className="text-xs text-red-600 mt-1">{fieldErrors.section}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                  <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Requested Items *</label>
                  <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><i className="bi bi-plus" /> Add Row</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                      <select value={item.material} onChange={(e) => updateItem(idx, 'material', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors[`material-${idx}`] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                        <option value="">Select material...</option>
                        {materials.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.uom})</option>)}
                      </select>
                      {fieldErrors[`material-${idx}`] && <p className="text-xs text-red-600 mt-1">{fieldErrors[`material-${idx}`]}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors[`qty-${idx}`] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                      {fieldErrors[`qty-${idx}`] && <p className="text-xs text-red-600 mt-1">{fieldErrors[`qty-${idx}`]}</p>}
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Item Note</label>
                      <input value={item.note} onChange={(e) => updateItem(idx, 'note', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional details" />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="w-full py-2 text-slate-400 hover:text-red-500 disabled:opacity-30" title="Remove row"><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Request Note</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Context for approver" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">{saving && <i className="bi bi-arrow-repeat animate-spin" />}Submit Requisition</button>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className={`px-6 py-4 rounded-t-2xl text-white ${reviewModal.action === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <h3 className="font-semibold">{reviewModal.action === 'approve' ? 'Approve Requisition' : 'Reject Requisition'}</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reviewed By</label>
                <input value={reviewForm.approvedBy} onChange={(e) => setReviewForm((f) => ({ ...f, approvedBy: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Manager name" />
              </div>
              {reviewModal.action === 'approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                    <select value={reviewForm.supplierId} onChange={(e) => setReviewForm((f) => ({ ...f, supplierId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select supplier...</option>
                      {suppliers.filter((s) => s.isActive).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                    <input type="date" value={reviewForm.expectedDeliveryDate} onChange={(e) => setReviewForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Review Note</label>
                <textarea value={reviewForm.approvalNote} onChange={(e) => setReviewForm((f) => ({ ...f, approvalNote: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleReview} disabled={reviewing} className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 ${reviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>{reviewing && <i className="bi bi-arrow-repeat animate-spin" />}{reviewModal.action === 'approve' ? 'Approve & Create PO' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}

      {detailReq && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailReq(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Requisition Details</h3>
              <button onClick={() => setDetailReq(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Requisition ID:</span> <span className="font-medium text-slate-800">{buildRequisitionCode(detailReq, 0)}</span></p>
              <p><span className="text-slate-500">Requested By:</span> <span className="text-slate-700">{detailReq.requestedBy}</span></p>
              <p><span className="text-slate-500">Section:</span> <span className="text-slate-700">{detailReq.section}</span></p>
              <p><span className="text-slate-500">Urgency:</span> <span className="text-slate-700 capitalize">{detailReq.urgency}</span></p>
              <p><span className="text-slate-500">Status:</span> <span className="text-slate-700 capitalize">{detailReq.status}</span></p>
              <p><span className="text-slate-500">Approved By:</span> <span className="text-slate-700">{detailReq.approvedBy || '-'}</span></p>
              <div>
                <p className="text-slate-500 mb-1">Items</p>
                <ul className="space-y-1">
                  {(detailReq.items || []).map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-xs bg-slate-50 rounded-lg px-2 py-1">{(item.material?.name || 'Unknown')} x {item.qty} {item.material?.uom || ''}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
