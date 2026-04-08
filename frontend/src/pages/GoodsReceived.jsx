import { useState, useEffect } from 'react';
import { getGRNs, createGRN, recordGRNPayment, getPurchaseOrders } from '../api/purchase';

const QC_COLORS = { pass: 'text-emerald-600', fail: 'text-red-600', pending: 'text-amber-600' };
const PAY_COLORS = { unpaid: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' };

export default function GoodsReceived() {
  const [grns, setGRNs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [selectedPO, setSelectedPO] = useState('');
  const [form, setForm] = useState({ receivedBy: '', notes: '', items: [] });
  const [payForm, setPayForm] = useState({ invoiceNumber: '', invoiceAmount: '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? { paymentStatus: tab } : {};
      const [g, o] = await Promise.all([getGRNs(params), getPurchaseOrders({ status: 'shipped' })]);
      setGRNs(g); setOrders(o);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);

  const handlePOSelect = (poId) => {
    setSelectedPO(poId);
    const po = orders.find(o => o._id === poId);
    if (po) {
      setForm(f => ({
        ...f,
        items: po.items.map(it => ({
          material: it.material?._id || null,
          description: it.description,
          orderedQty: it.qty,
          receivedQty: it.qty,
          qcStatus: 'pending',
          qcNote: '',
        })),
      }));
    }
  };

  const updateItem = (i, field, val) => setForm(f => ({
    ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it)
  }));

  const handleSave = async () => {
    if (!selectedPO) { setError('Select a PO'); return; }
    if (!form.receivedBy.trim()) { setError('Receiver name required'); return; }
    const allQcDone = form.items.every(it => it.qcStatus !== 'pending');
    const overallQcStatus = allQcDone
      ? form.items.every(it => it.qcStatus === 'pass') ? 'pass'
        : form.items.some(it => it.qcStatus === 'pass') ? 'partial' : 'fail'
      : 'pending';
    setSaving(true);
    try {
      await createGRN({ ...form, purchaseOrder: selectedPO, receivedDate: new Date(), overallQcStatus });
      setShowModal(false); setSelectedPO(''); setForm({ receivedBy: '', notes: '', items: [] });
      await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!payModal) return;
    setSaving(true);
    try {
      await recordGRNPayment(payModal._id, payForm);
      setPayModal(null); setPayForm({ invoiceNumber: '', invoiceAmount: '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' });
      await load();
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Goods Received Notes</h1>
          <p className="text-slate-500 text-sm">Record incoming stock, QC checks and payments</p>
        </div>
        <button onClick={() => { setForm({ receivedBy: '', notes: '', items: [] }); setSelectedPO(''); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New GRN
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['all', 'unpaid', 'partial', 'paid'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
        : grns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <i className="bi bi-inbox text-5xl block mb-3 opacity-20" />No GRNs found.
          </div>
        ) : (
          <div className="space-y-3">
            {grns.map(g => {
              const outstanding = (g.invoiceAmount || 0) - (g.amountPaid || 0);
              return (
                <div key={g._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800">{g.grnNumber}</span>
                        <span className="text-slate-400 text-sm">← {g.purchaseOrder?.poNumber} ({g.purchaseOrder?.supplier?.name})</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLORS[g.paymentStatus]}`}>{g.paymentStatus}</span>
                        <span className={`text-xs font-medium ${QC_COLORS[g.overallQcStatus]}`}>
                          <i className={`bi ${g.overallQcStatus === 'pass' ? 'bi-check-circle-fill' : g.overallQcStatus === 'fail' ? 'bi-x-circle-fill' : 'bi-hourglass-split'} mr-1`} />
                          QC: {g.overallQcStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Received: {new Date(g.receivedDate).toLocaleDateString('en-GB')} by {g.receivedBy}</p>
                      <div className="mt-2 space-y-1">
                        {g.items.map((it, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="font-medium text-slate-700">{it.description}</span>
                            <span className="text-slate-400">ordered: {it.orderedQty} / received: <strong className="text-slate-700">{it.receivedQty}</strong></span>
                            <span className={`text-xs font-medium ${QC_COLORS[it.qcStatus]}`}>{it.qcStatus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-slate-500 text-sm">Invoice: <span className="font-semibold text-slate-700">Rs. {g.invoiceAmount?.toLocaleString() || '—'}</span></p>
                      <p className="text-slate-500 text-sm">Paid: <span className="font-semibold text-emerald-700">Rs. {g.amountPaid?.toLocaleString() || 0}</span></p>
                      {outstanding > 0 && <p className="text-red-600 text-sm font-semibold">Outstanding: Rs. {outstanding.toLocaleString()}</p>}
                      {g.paymentStatus !== 'paid' && (
                        <button onClick={() => { setPayModal(g); setPayForm({ invoiceNumber: g.invoiceNumber || '', invoiceAmount: g.invoiceAmount || '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' }); }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                          <i className="bi bi-credit-card mr-1" />Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* New GRN Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">New Goods Received Note</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Order (Shipped) *</label>
                  <select value={selectedPO} onChange={e => handlePOSelect(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select shipped PO…</option>
                    {orders.map(o => <option key={o._id} value={o._id}>{o.poNumber} — {o.supplier?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Received By *</label>
                  <input value={form.receivedBy} onChange={e => setForm(f => ({ ...f, receivedBy: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {form.items.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Item QC Check</p>
                  {form.items.map((it, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="font-medium text-slate-700 text-sm">{it.description} <span className="text-slate-400 font-normal">(ordered: {it.orderedQty})</span></p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Received Qty</label>
                          <input type="number" min="0" value={it.receivedQty} onChange={e => updateItem(i, 'receivedQty', Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">QC Result</label>
                          <select value={it.qcStatus} onChange={e => updateItem(i, 'qcStatus', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="pending">Pending</option>
                            <option value="pass">✓ Pass</option>
                            <option value="fail">✗ Fail</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">QC Note</label>
                          <input value={it.qcNote} onChange={e => updateItem(i, 'qcNote', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Save GRN & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Record Payment — {payModal.grnNumber}</h3>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Invoice No.</label>
                  <input value={payForm.invoiceNumber} onChange={e => setPayForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Amount (Rs.)</label>
                  <input type="number" value={payForm.invoiceAmount} onChange={e => setPayForm(f => ({ ...f, invoiceAmount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount Paying Now (Rs.) *</label>
                <input type="number" value={payForm.amountPaid} onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note</label>
                <input value={payForm.paymentNote} onChange={e => setPayForm(f => ({ ...f, paymentNote: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setPayModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handlePayment} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
