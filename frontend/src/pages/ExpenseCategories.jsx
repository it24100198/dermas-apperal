import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/expenses';

const TYPE_OPTIONS = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'internet', label: 'Internet' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const emptyForm = { name: '', type: 'other', description: '', isRecurring: false, recurringDay: '', parentCategory: '' };

export default function ExpenseCategories() {
  const [masters, setMasters]     = useState([]);
  const [subs, setSubs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubcat, setIsSubcat]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const all = await getCategories();
      setMasters(all.filter(c => !c.parentCategory));
      setSubs(all.filter(c => c.parentCategory));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = (sub = false) => {
    setIsSubcat(sub);
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };
  const openEdit = (cat, sub) => {
    setIsSubcat(sub);
    setEditing(cat._id);
    setForm({
      name: cat.name,
      type: cat.type,
      description: cat.description || '',
      isRecurring: cat.isRecurring,
      recurringDay: cat.recurringDay || '',
      parentCategory: cat.parentCategory?._id || cat.parentCategory || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isSubcat) delete payload.parentCategory;
      if (!payload.isRecurring) { payload.recurringDay = null; }
      if (editing) await updateCategory(editing, payload);
      else await createCategory(payload);
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategory(id); await load(); } catch { }
  };

  const md = (sub) => {
    const parent = masters.find(m => m._id === (sub.parentCategory?._id || sub.parentCategory));
    return parent?.name || '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expense Categories</h1>
          <p className="text-slate-500 text-sm">Manage master categories and sub-categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Master Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <i className="bi bi-folder-fill text-indigo-500" /> Master Categories
            </h2>
            <button onClick={() => openAdd(false)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
              <i className="bi bi-plus-lg" /> Add
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading…</div>
          ) : masters.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No master categories yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {masters.map((cat) => (
                <li key={cat._id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                        {TYPE_OPTIONS.find(t => t.value === cat.type)?.label || cat.type}
                      </span>
                      {cat.isRecurring && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                          <i className="bi bi-arrow-repeat" /> Recurring – Day {cat.recurringDay}
                        </span>
                      )}
                    </div>
                    {cat.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat, false)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <i className="bi bi-pencil text-sm" />
                    </button>
                    <button onClick={() => handleDelete(cat._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <i className="bi bi-trash text-sm" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sub-Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <i className="bi bi-folder2-open text-emerald-500" /> Sub-Categories
            </h2>
            <button onClick={() => openAdd(true)} disabled={masters.length === 0}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
              <i className="bi bi-plus-lg" /> Add
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading…</div>
          ) : subs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No sub-categories yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {subs.map((cat) => (
                <li key={cat._id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <i className="bi bi-arrow-return-right" /> under <span className="font-medium text-slate-600 ml-1">{md(cat)}</span>
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat, true)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <i className="bi bi-pencil text-sm" />
                    </button>
                    <button onClick={() => handleDelete(cat._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <i className="bi bi-trash text-sm" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                {editing ? 'Edit' : 'New'} {isSubcat ? 'Sub-Category' : 'Master Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Machine Repair" />
              </div>
              {isSubcat && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category *</label>
                  <select value={form.parentCategory} onChange={e => setForm(f => ({...f, parentCategory: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select…</option>
                    {masters.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              {!isSubcat && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional description" />
              </div>
              {!isSubcat && (
                <div className="space-y-3 bg-amber-50 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isRecurring}
                      onChange={e => setForm(f => ({...f, isRecurring: e.target.checked}))}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-medium text-amber-800">Recurring monthly expense</span>
                  </label>
                  {form.isRecurring && (
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Due on day of month</label>
                      <select value={form.recurringDay} onChange={e => setForm(f => ({...f, recurringDay: e.target.value}))}
                        className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">Select day…</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
