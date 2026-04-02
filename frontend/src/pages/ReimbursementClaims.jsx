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

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

const emptyForm = { employeeName: '', amount: '', type: 'travel', description: '', receiptUrl: '' };

export default function ReimbursementClaims() {
  const [claims, setClaims]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [reviewNote, setReviewNote]   = useState('');
  const [reviewing, setReviewing]     = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? { status: tab } : {};
      setClaims(await getReimbursements(params));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({...f, receiptUrl: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.employeeName.trim()) { setError('Employee name is required'); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError('Valid amount is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    setSaving(true);
    try {
      await createReimbursement({ ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm(emptyForm);
      setTab('pending');
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

  const pendingCount = claims.filter(c => c.status === 'pending').length;
  const totalPending = claims.filter(c=>c.status==='pending').reduce((s,c)=>s+c.amount,0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reimbursement Claims</h1>
          <p className="text-slate-500 text-sm">Employee expense claim submission and approval</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> Submit Claim
        </button>
      </div>

      {/* Summary Banner */}
      {tab === 'pending' && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <i className="bi bi-hourglass-split text-amber-500 text-2xl" />
          <div>
            <p className="font-semibold text-amber-800">{pendingCount} claim{pendingCount>1?'s':''} pending approval</p>
            <p className="text-amber-600 text-sm">Total: {formatLKR(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading…</div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <i className="bi bi-inbox text-5xl block mb-3 opacity-20" />
          No {tab !== 'all' ? tab : ''} claims found.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <i className={`bi ${TYPE_OPTS.find(t=>t.value===claim.type)?.icon || 'bi-receipt'} text-indigo-600 text-lg`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{claim.employeeName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${STATUS_COLORS[claim.status]}`}>
                        <i className={`bi ${STATUS_ICONS[claim.status]}`} />
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {TYPE_OPTS.find(t=>t.value===claim.type)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{claim.description}</p>
                    {claim.reviewNote && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        <i className="bi bi-chat-left-text mr-1" />Note: {claim.reviewNote}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted: {new Date(claim.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      {claim.reviewedAt && ` · Reviewed: ${new Date(claim.reviewedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="text-xl font-bold text-slate-800">{formatLKR(claim.amount)}</p>
                  <div className="flex gap-2">
                    {claim.receiptUrl && (
                      <a href={claim.receiptUrl} target="_blank" rel="noreferrer"
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1">
                        <i className="bi bi-paperclip" /> Receipt
                      </a>
                    )}
                    {claim.status === 'pending' && (
                      <>
                        <button onClick={() => openReview(claim._id, 'approve')}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                          <i className="bi bi-check-lg" /> Approve
                        </button>
                        <button onClick={() => openReview(claim._id, 'reject')}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 flex items-center gap-1">
                          <i className="bi bi-x-lg" /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(claim._id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <i className="bi bi-trash text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Submit Reimbursement Claim</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name *</label>
                <input value={form.employeeName} onChange={e=>setForm(f=>({...f, employeeName:e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TYPE_OPTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe the expense (e.g., Taxi to supplier meeting on 28 March)" />
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

      {/* Approve / Reject Modal */}
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
