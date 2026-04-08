import { useState, useEffect } from 'react';
import { getStockOverview, getAdjustments, createAdjustment } from '../api/stock';
import { getMaterials } from '../api/purchase';

const REASONS = ['damaged', 'audit_correction', 'expired', 'returned', 'found', 'other'];
const REASON_LABELS = {
  damaged: 'Damaged', audit_correction: 'Audit Correction', expired: 'Expired',
  returned: 'Returned', found: 'Found / Surplus', other: 'Other',
};
const REASON_COLORS = {
  damaged: 'bg-red-100 text-red-700', audit_correction: 'bg-blue-100 text-blue-700',
  expired: 'bg-orange-100 text-orange-700', returned: 'bg-teal-100 text-teal-700',
  found: 'bg-emerald-100 text-emerald-700', other: 'bg-slate-100 text-slate-600',
};

const emptyForm = { material: '', adjustmentType: 'subtract', quantity: '', reason: 'damaged', note: '', adjustedBy: '' };

function formatLKR(n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

export default function StockAdjustments() {
  const [overview, setOverview] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, mats, adjs] = await Promise.all([getStockOverview(), getMaterials(), getAdjustments()]);
      setOverview(ov); setMaterials(mats); setAdjustments(adjs);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Live preview of new stock
  useEffect(() => {
    if (!form.material || !form.quantity) { setPreview(null); return; }
    const mat = materials.find(m => m._id === form.material);
    if (!mat) return;
    const delta = form.adjustmentType === 'add' ? Number(form.quantity) : -Number(form.quantity);
    const newStock = Math.max(0, mat.currentStock + delta);
    setPreview({ current: mat.currentStock, newStock, uom: mat.uom });
  }, [form.material, form.adjustmentType, form.quantity, materials]);

  const handleSave = async () => {
    if (!form.material) { setError('Select a material'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Enter a valid quantity'); return; }
    if (!form.adjustedBy.trim()) { setError('Enter who is making the adjustment'); return; }
    setSaving(true);
    try {
      await createAdjustment({ ...form, quantity: Number(form.quantity) });
      setShowModal(false); setForm(emptyForm); setPreview(null);
      await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Adjustments</h1>
          <p className="text-slate-500 text-sm">Manual corrections for damaged goods, audit discrepancies, and returns</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(''); setPreview(null); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-sliders" /> Adjust Stock
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: overview?.totalItems ?? '—', icon: 'bi-boxes', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Inventory Value', value: overview ? formatLKR(overview.totalValue) : '—', icon: 'bi-currency-rupee', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Low Stock Items', value: overview?.lowStock ?? '—', icon: 'bi-exclamation-triangle-fill', color: 'bg-amber-50 text-amber-600' },
          { label: 'Out of Stock', value: overview?.outOfStock ?? '—', icon: 'bi-x-circle-fill', color: 'bg-red-50 text-red-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
              <i className={`bi ${c.icon} text-xl`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{loading ? '…' : c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Material Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">Current Stock Levels</h2>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading…</div>
          : materials.length === 0 ? <div className="p-8 text-center text-slate-400">No materials registered.</div> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Material', 'Category', 'Stock', 'UOM', 'Reorder Lvl', 'Value', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map(m => {
                  const isLow = m.reorderLevel > 0 && m.currentStock <= m.reorderLevel;
                  const isOut = m.currentStock === 0;
                  return (
                    <tr key={m._id} className={`hover:bg-slate-50 transition-colors ${isOut ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{m.category}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-lg ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {m.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{m.uom}</td>
                      <td className="px-4 py-3 text-slate-500">{m.reorderLevel || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatLKR(m.currentStock * (m.unitPrice || 0))}</td>
                      <td className="px-4 py-3">
                        {isOut ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
                          : isLow ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock</span>
                            : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Recent Adjustments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 text-sm">Recent Adjustments</h2>
        </div>
        {adjustments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No adjustments recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>{['Date', 'Material', 'Type', 'Qty', 'Reason', 'Before → After', 'By'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adjustments.slice(0, 30).map(a => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.material?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.adjustmentType === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {a.adjustmentType === 'add' ? '+' : '−'} {a.adjustmentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    <span className={a.adjustmentType === 'add' ? 'text-emerald-600' : 'text-red-600'}>
                      {a.adjustmentType === 'add' ? '+' : '−'}{a.quantity} {a.material?.uom}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REASON_COLORS[a.reason]}`}>{REASON_LABELS[a.reason]}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.previousStock} → <strong className="text-slate-700">{a.newStock}</strong></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.adjustedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Material *</label>
                <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select material…</option>
                  {materials.map(m => <option key={m._id} value={m._id}>{m.name} — stock: {m.currentStock} {m.uom}</option>)}
                </select>
              </div>

              {/* Add / Subtract Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[['add', '+ Add Stock', 'emerald'], ['subtract', '− Remove Stock', 'red']].map(([val, label, color]) => (
                    <button key={val} type="button" onClick={() => setForm(f => ({ ...f, adjustmentType: val }))}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${form.adjustmentType === val
                        ? color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input type="number" min="0.01" step="0.01" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                  <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {REASONS.map(r => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {preview && (
                <div className={`rounded-xl p-4 flex items-center gap-4 ${form.adjustmentType === 'add' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Current</p>
                    <p className="font-bold text-slate-800 text-lg">{preview.current} <span className="text-xs font-normal">{preview.uom}</span></p>
                  </div>
                  <i className={`bi bi-arrow-right text-xl ${form.adjustmentType === 'add' ? 'text-emerald-500' : 'text-red-500'}`} />
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">New Stock</p>
                    <p className={`font-bold text-2xl ${form.adjustmentType === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>{preview.newStock} <span className="text-xs font-normal">{preview.uom}</span></p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adjusted By *</label>
                <input value={form.adjustedBy} onChange={e => setForm(f => ({ ...f, adjustedBy: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Additional details…" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
