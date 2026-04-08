import { useState, useEffect } from 'react';
import { getIssuances, createIssuance } from '../api/stock';
import { getMaterials } from '../api/purchase';

const PRODUCTION_LINES = ['Cutting Line', 'Sewing Line 1', 'Sewing Line 2', 'Washing', 'Finishing', 'Quality Control', 'Packing', 'Other'];

const emptyForm = {
  material: '', issuedTo: '', issuedBy: '', quantity: '', jobReference: '', note: '',
};

export default function MaterialIssuancePage() {
  const [issuances, setIssuances] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [iss, mats] = await Promise.all([getIssuances(), getMaterials()]);
      setIssuances(iss); setMaterials(mats);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const selectedMaterial = materials.find(m => m._id === form.material);
  const remaining = selectedMaterial
    ? Math.max(0, selectedMaterial.currentStock - Number(form.quantity || 0))
    : null;
  const isOverstock = selectedMaterial && Number(form.quantity) > selectedMaterial.currentStock;

  const handleSave = async () => {
    if (!form.material) { setError('Select a material'); return; }
    if (!form.issuedTo.trim()) { setError('Select a production line'); return; }
    if (!form.issuedBy.trim()) { setError('Enter who is issuing'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Enter a valid quantity'); return; }
    if (isOverstock) { setError(`Cannot issue more than current stock (${selectedMaterial.currentStock} ${selectedMaterial.uom})`); return; }
    setSaving(true);
    try {
      await createIssuance({ ...form, quantity: Number(form.quantity) });
      setShowModal(false); setForm(emptyForm);
      await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  // summary totals
  const totalIssued = issuances.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Material Issuance</h1>
          <p className="text-slate-500 text-sm">Formally transfer raw materials from store to production lines</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-box-arrow-right" /> Issue Materials
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Issuances', value: issuances.length, icon: 'bi-arrow-right-circle-fill', color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Total Qty Issued', value: `${totalIssued.toLocaleString()} items`, icon: 'bi-box-seam', color: 'text-amber-600 bg-amber-50' },
          { label: 'Materials Available', value: materials.filter(m => m.currentStock > 0).length, icon: 'bi-boxes', color: 'text-emerald-600 bg-emerald-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
              <i className={`bi ${c.icon} text-xl`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{loading ? '…' : c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Issuance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 text-sm">Issuance Records</h2>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading…</div>
          : issuances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="bi bi-box-arrow-right text-5xl block mb-3 opacity-20" />No issuances recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Date', 'Material', 'Qty', 'Issued To', 'Job Ref', 'Stock After', 'By'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issuances.map(iss => (
                  <tr key={iss._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(iss.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{iss.material?.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-red-600">−{iss.quantity}</span>
                      <span className="text-slate-400 ml-1 text-xs">{iss.material?.uom}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {iss.issuedTo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{iss.jobReference || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {iss.previousStock} → <strong className="text-slate-800">{iss.newStock}</strong>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{iss.issuedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Issue Materials to Production</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Material *</label>
                <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select material…</option>
                  {materials.filter(m => m.currentStock > 0).map(m => (
                    <option key={m._id} value={m._id}>{m.name} — {m.currentStock} {m.uom} available</option>
                  ))}
                </select>
              </div>

              {/* Stock indicator */}
              {selectedMaterial && (
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-bold text-slate-800">{selectedMaterial.currentStock} {selectedMaterial.uom}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issue To *</label>
                  <select value={form.issuedTo} onChange={e => setForm(f => ({ ...f, issuedTo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select line…</option>
                    {PRODUCTION_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input type="number" min="0.01" step="0.01" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isOverstock ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-500'}`} />
                  {isOverstock && <p className="text-red-500 text-xs mt-1">Exceeds available stock!</p>}
                  {remaining !== null && !isOverstock && form.quantity && (
                    <p className="text-emerald-600 text-xs mt-1">Remaining after: {remaining} {selectedMaterial?.uom}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issued By *</label>
                  <input value={form.issuedBy} onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Store keeper name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job / Order Ref</label>
                  <input value={form.jobReference} onChange={e => setForm(f => ({ ...f, jobReference: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. JOB-0042" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving || isOverstock}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Issue & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
