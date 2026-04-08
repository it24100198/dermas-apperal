import { useState, useEffect } from 'react';
import { getMaterials, getReorderAlerts, createMaterial, updateMaterial, deleteMaterial, getSuppliers } from '../api/purchase';

const CATEGORIES = ['fabric', 'accessory', 'packaging', 'thread', 'chemical', 'other'];
const UOMS = ['meters', 'kg', 'pcs', 'rolls', 'liters', 'boxes'];
const emptyForm = { name: '', description: '', category: 'fabric', uom: 'meters', reorderLevel: 0, currentStock: 0, unitPrice: 0, preferredSupplier: '' };

const CAT_COLORS = {
  fabric: 'bg-blue-100 text-blue-700', accessory: 'bg-purple-100 text-purple-700',
  packaging: 'bg-amber-100 text-amber-700', thread: 'bg-emerald-100 text-emerald-700',
  chemical: 'bg-rose-100 text-rose-700', other: 'bg-slate-100 text-slate-700',
};

export default function MaterialCatalogPage() {
  const [materials, setMaterials] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, a, s] = await Promise.all([getMaterials(), getReorderAlerts(), getSuppliers()]);
      setMaterials(m); setAlerts(a); setSuppliers(s);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (m) => { setEditing(m._id); setForm({ ...m, preferredSupplier: m.preferredSupplier?._id || '' }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, reorderLevel: Number(form.reorderLevel), currentStock: Number(form.currentStock), unitPrice: Number(form.unitPrice) };
      if (!payload.preferredSupplier) delete payload.preferredSupplier;
      if (editing) await updateMaterial(editing, payload);
      else await createMaterial(payload);
      setShowModal(false); await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await deleteMaterial(id); await load(); } catch { }
  };

  const isAlert = (m) => m.reorderLevel > 0 && m.currentStock <= m.reorderLevel;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Material Catalog</h1>
          <p className="text-slate-500 text-sm">Registered items with UOM and reorder alerts</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> Add Material
        </button>
      </div>

      {/* Reorder Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="bi bi-exclamation-triangle-fill text-red-500" />
            <span className="font-semibold text-red-800">{alerts.length} item{alerts.length > 1 ? 's' : ''} below reorder level!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map(a => (
              <span key={a._id} className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1">
                <i className="bi bi-arrow-down-circle-fill" /> {a.name} — {a.currentStock} {a.uom} (min: {a.reorderLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
          : materials.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="bi bi-boxes text-4xl block mb-3 opacity-20" />No materials registered yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Material', 'Category', 'UOM', 'Stock', 'Reorder Lvl', 'Unit Price', 'Supplier', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map(m => (
                  <tr key={m._id} className={`hover:bg-slate-50 group transition-colors ${isAlert(m) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isAlert(m) && <i className="bi bi-exclamation-triangle-fill text-red-500 text-xs" />}
                        <div>
                          <p className="font-semibold text-slate-800">{m.name}</p>
                          {m.description && <p className="text-xs text-slate-400 truncate max-w-[160px]">{m.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[m.category] || CAT_COLORS.other}`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.uom}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isAlert(m) ? 'text-red-600' : 'text-slate-800'}`}>{m.currentStock}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.reorderLevel}</td>
                    <td className="px-4 py-3 text-slate-600">Rs. {m.unitPrice?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.preferredSupplier?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><i className="bi bi-pencil text-sm" /></button>
                        <button onClick={() => handleDelete(m._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><i className="bi bi-trash text-sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit' : 'New'} Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
                  <select value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {UOMS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                  <input type="number" min="0" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (Rs.)</label>
                  <input type="number" min="0" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Supplier</label>
                <select value={form.preferredSupplier} onChange={e => setForm(f => ({ ...f, preferredSupplier: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">None</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}{editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
