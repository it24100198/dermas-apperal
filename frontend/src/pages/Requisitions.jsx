import { useState, useEffect } from 'react';
import { getRequisitions, createRequisition, approveRequisition, rejectRequisition, getMaterials, getSuppliers } from '../api/purchase';

const URGENCY_COLORS = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };
const STATUS_COLORS = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };

const emptyForm = { requestedBy: '', section: '', urgency: 'medium', items: [{ material: '', qty: 1, note: '' }] };

export default function Requisitions() {
  const [reqs, setReqs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ approvedBy: '', approvalNote: '', supplierId: '', expectedDeliveryDate: '' });
  const [reviewing, setReviewing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? { status: tab } : {};
      const [r, m, s] = await Promise.all([getRequisitions(params), getMaterials(), getSuppliers()]);
      setReqs(r); setMaterials(m); setSuppliers(s);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { material: '', qty: 1, note: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({
    ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it)
  }));

  const handleSubmit = async () => {
    if (!form.requestedBy.trim()) { setError('Requester name required'); return; }
    if (!form.section.trim()) { setError('Section required'); return; }
    if (form.items.some(it => !it.material)) { setError('All items need a material selected'); return; }
    setSaving(true);
    try {
      await createRequisition(form);
      setShowModal(false); setForm(emptyForm); setTab('pending');
    } catch (e) { setError(e?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      if (reviewModal.action === 'approve') {
        if (!reviewForm.supplierId) { setError('Select a supplier'); setReviewing(false); return; }
        await approveRequisition(reviewModal.id, reviewForm);
      } else {
        await rejectRequisition(reviewModal.id, reviewForm);
      }
      setReviewModal(null); await load();
    } catch { } finally { setReviewing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Requisitions</h1>
          <p className="text-slate-500 text-sm">Internal material requests with approval workflow</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New Requisition
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['pending', 'approved', 'rejected', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
        : reqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <i className="bi bi-clipboard-plus text-5xl block mb-3 opacity-20" />No {tab !== 'all' ? tab : ''} requisitions.
          </div>
        ) : (
          <div className="space-y-3">
            {reqs.map(r => (
              <div key={r._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800">{r.requestedBy}</span>
                      <span className="text-slate-400 text-sm">— {r.section}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[r.urgency]}`}>{r.urgency} urgency</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <div className="space-y-1">
                      {r.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <i className="bi bi-dot text-slate-400" />
                          <span className="font-medium text-slate-700">{it.material?.name || '—'}</span>
                          <span className="text-slate-400">×{it.qty} {it.material?.uom}</span>
                          {it.note && <span className="text-slate-400 italic">— {it.note}</span>}
                        </div>
                      ))}
                    </div>
                    {r.approvalNote && <p className="mt-2 text-xs text-slate-400 italic"><i className="bi bi-chat-left-text mr-1" />{r.approvalNote}</p>}
                    {r.linkedPO && <p className="mt-2 text-xs text-emerald-600 font-medium"><i className="bi bi-receipt mr-1" />PO: {r.linkedPO.poNumber} — {r.linkedPO.status}</p>}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => { setReviewModal({ id: r._id, action: 'approve' }); setReviewForm({ approvedBy: '', approvalNote: '', supplierId: '', expectedDeliveryDate: '' }); }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                        <i className="bi bi-check-lg" /> Approve
                      </button>
                      <button onClick={() => { setReviewModal({ id: r._id, action: 'reject' }); setReviewForm({ approvedBy: '', approvalNote: '', supplierId: '', expectedDeliveryDate: '' }); }}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 flex items-center gap-1">
                        <i className="bi bi-x-lg" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">New Purchase Requisition</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requested By *</label>
                  <input value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section *</label>
                  <input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Cutting, Washing" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(u => (
                    <button key={u} type="button" onClick={() => setForm(f => ({ ...f, urgency: u }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${form.urgency === u ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Items *</label>
                  <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><i className="bi bi-plus" />Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={it.material} onChange={e => updateItem(i, 'material', e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select material…</option>
                        {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.uom})</option>)}
                      </select>
                      <input type="number" min="1" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Qty" />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500 p-1"><i className="bi bi-trash text-sm" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className={`px-6 py-4 rounded-t-2xl text-white ${reviewModal.action === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <h3 className="font-semibold">{reviewModal.action === 'approve' ? '✓ Approve Requisition' : '✗ Reject Requisition'}</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reviewed By</label>
                <input value={reviewForm.approvedBy} onChange={e => setReviewForm(f => ({ ...f, approvedBy: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Manager name" />
              </div>
              {reviewModal.action === 'approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                    <select value={reviewForm.supplierId} onChange={e => setReviewForm(f => ({ ...f, supplierId: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select supplier…</option>
                      {suppliers.filter(s => s.isActive).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
                    <input type="date" value={reviewForm.expectedDeliveryDate} onChange={e => setReviewForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea value={reviewForm.approvalNote} onChange={e => setReviewForm(f => ({ ...f, approvalNote: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setReviewModal(null); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleReview} disabled={reviewing}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 ${reviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {reviewing && <i className="bi bi-arrow-repeat animate-spin" />}
                {reviewModal.action === 'approve' ? 'Approve & Create PO' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
