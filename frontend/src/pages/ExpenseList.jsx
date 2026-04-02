import { useState, useEffect, useRef } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, createCategory } from '../api/expenses';

const PM_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', credit_card: 'Credit Card' };
const PM_COLORS = { cash: 'bg-emerald-100 text-emerald-700', bank_transfer: 'bg-blue-100 text-blue-700', credit_card: 'bg-purple-100 text-purple-700' };

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

const emptyForm = {
  category: '', amount: '', date: new Date().toISOString().slice(0, 10),
  description: '', paymentMethod: 'cash', isPettyCash: false,
  vendorName: '', receiptUrl: '', isRecurring: false,
};

export default function ExpenseList() {
  const [expenses, setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [filters, setFilters]     = useState({ paymentMethod: '', isPettyCash: '' });
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([getExpenses(filters), getCategories()]);
      setExpenses(exp);
      setCategories(cats);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (e) => {
    setEditing(e._id);
    setForm({
      category: e.category?._id || '',
      amount: e.amount,
      date: new Date(e.date).toISOString().slice(0, 10),
      description: e.description || '',
      paymentMethod: e.paymentMethod,
      isPettyCash: e.isPettyCash,
      vendorName: e.vendorName || '',
      receiptUrl: e.receiptUrl || '',
      isRecurring: e.isRecurring,
    });
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

  const handleSave = async () => {
    if (!form.category) { setError('Category is required'); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError('Valid amount is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await updateExpense(editing, payload);
      else await createExpense(payload);
      setShowModal(false);
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
      setForm(f => ({ ...f, category: resp._id }));
      setShowCatForm(false);
      setNewCatName('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Expenses</h1>
          <p className="text-slate-500 text-sm">Record and manage factory expenses</p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> Add Expense
        </button>
      </div>

      {/* Filters + total */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <select value={filters.paymentMethod} onChange={e => setFilters(f=>({...f, paymentMethod: e.target.value}))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Payment Methods</option>
          {Object.entries(PM_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.isPettyCash} onChange={e => setFilters(f=>({...f, isPettyCash: e.target.value}))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Types</option>
          <option value="true">Petty Cash Only</option>
          <option value="false">Non-Petty Cash</option>
        </select>
        <div className="ml-auto bg-indigo-50 rounded-lg px-4 py-2">
          <span className="text-xs text-indigo-700 font-medium">Showing Total: </span>
          <span className="text-sm font-bold text-indigo-800">{formatLKR(total)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="bi bi-receipt text-4xl block mb-3 opacity-30" />
            No expenses found. Add your first expense!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                {['Date','Category','Description','Vendor','Method','Amount','Receipt','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{e.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{e.vendorName || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PM_COLORS[e.paymentMethod]}`}>
                        {PM_LABELS[e.paymentMethod]}
                      </span>
                      {e.isPettyCash && <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Petty Cash</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{formatLKR(e.amount)}</td>
                  <td className="px-4 py-3">
                    {e.receiptUrl ? (
                      <a href={e.receiptUrl} target="_blank" rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 text-xs">
                        <i className="bi bi-paperclip" /> View
                      </a>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <i className="bi bi-pencil text-sm" />
                      </button>
                      <button onClick={() => handleDelete(e._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <i className="bi bi-trash text-sm" />
                      </button>
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
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit' : 'New'} Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
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
                    <select value={form.category} onChange={e => setForm(f=>({...f, category: e.target.value}))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                      <option value="">Select…</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.parentCategory ? `↳ ${c.name}` : c.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" min="0" value={form.amount} onChange={e => setForm(f=>({...f, amount: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f=>({...f, date: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f=>({...f, paymentMethod: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {Object.entries(PM_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Service Provider</label>
                <input value={form.vendorName} onChange={e => setForm(f=>({...f, vendorName: e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Vendor or landlord name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Brief description…" />
              </div>
              {/* Receipt Upload */}
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
                  <input type="checkbox" checked={form.isPettyCash} onChange={e => setForm(f=>({...f, isPettyCash: e.target.checked}))}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-medium text-slate-700">Petty Cash</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f=>({...f, isRecurring: e.target.checked}))}
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
