import { useEffect, useMemo, useState } from 'react';
import {
  getMaterialsList,
  getReorderAlerts,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getSuppliers,
} from '../api/purchase';
import { downloadCsv } from '../utils/csvExport';

const CATEGORIES = ['fabric', 'accessory', 'packaging', 'thread', 'chemical', 'other'];
const UOMS = ['meters', 'kg', 'pcs', 'rolls', 'liters', 'boxes'];
const PAGE_SIZE = 8;

const emptyForm = {
  name: '',
  description: '',
  category: 'fabric',
  uom: 'meters',
  reorderLevel: 0,
  currentStock: 0,
  unitPrice: 0,
  preferredSupplier: '',
};

const CAT_COLORS = {
  fabric: 'bg-blue-100 text-blue-700',
  accessory: 'bg-purple-100 text-purple-700',
  packaging: 'bg-amber-100 text-amber-700',
  thread: 'bg-emerald-100 text-emerald-700',
  chemical: 'bg-rose-100 text-rose-700',
  other: 'bg-slate-100 text-slate-700',
};

const buildMaterialCode = (material, index) => {
  if (material?.materialCode) return material.materialCode;
  const fallback = String(index + 1).padStart(4, '0');
  const suffix = material?._id ? material._id.slice(-6).toUpperCase() : fallback;
  return `MAT-${suffix}`;
};

const getMaterialStatus = (material) => {
  if (material.reorderLevel > 0 && material.currentStock <= material.reorderLevel) {
    return { label: 'Reorder', className: 'bg-rose-100 text-rose-700' };
  }
  return { label: 'Healthy', className: 'bg-emerald-100 text-emerald-700' };
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
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uomFilter, setUomFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [reorderFilter, setReorderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailMaterial, setDetailMaterial] = useState(null);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = { page: nextPage, pageSize: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (uomFilter !== 'all') params.uom = uomFilter;
      if (supplierFilter !== 'all') params.supplierId = supplierFilter;
      if (reorderFilter !== 'all') params.reorderStatus = reorderFilter;

      const [m, a, s] = await Promise.all([getMaterialsList(params), getReorderAlerts(), getSuppliers()]);
      setMaterials(m.items || []);
      setTotal(m.total || 0);
      setTotalPages(m.totalPages || 1);
      setPage(m.page || nextPage);
      setAlerts(a);
      setSuppliers(s);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to load materials right now.' });
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
  }, [search, categoryFilter, uomFilter, supplierFilter, reorderFilter]);

  useEffect(() => {
    load(page);
  }, [page, search, categoryFilter, uomFilter, supplierFilter, reorderFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (material) => {
    setEditing(material._id);
    setForm({
      ...emptyForm,
      ...material,
      preferredSupplier: material.preferredSupplier?._id || '',
    });
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Material name is required.';
    if (Number(form.reorderLevel) < 0) nextErrors.reorderLevel = 'Reorder level cannot be negative.';
    if (Number(form.currentStock) < 0) nextErrors.currentStock = 'Current stock cannot be negative.';
    if (Number(form.unitPrice) < 0) nextErrors.unitPrice = 'Unit price cannot be negative.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setFormError('Please fix highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        reorderLevel: Number(form.reorderLevel),
        currentStock: Number(form.currentStock),
        unitPrice: Number(form.unitPrice),
      };

      if (!payload.preferredSupplier) delete payload.preferredSupplier;

      if (editing) {
        await updateMaterial(editing, payload);
        setFeedback({ type: 'success', message: 'Material updated successfully.' });
      } else {
        await createMaterial(payload);
        setFeedback({ type: 'success', message: 'Material added successfully.' });
      }

      setShowModal(false);
      setForm(emptyForm);
      await load(page);
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Failed to save material.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await deleteMaterial(id);
      setFeedback({ type: 'success', message: 'Material deleted.' });
      await load(page);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to delete material.' });
    }
  };

  const rows = useMemo(() => materials, [materials]);

  const exportCsv = () => {
    downloadCsv({
      fileName: 'materials-export.csv',
      columns: [
        { header: 'Material Code', accessor: (m) => m.materialCode || buildMaterialCode(m, 0) },
        { header: 'Material Name', accessor: (m) => m.name },
        { header: 'Category', accessor: (m) => m.category },
        { header: 'UOM', accessor: (m) => m.uom },
        { header: 'Reorder Level', accessor: (m) => m.reorderLevel },
        { header: 'Current Stock', accessor: (m) => m.currentStock },
        { header: 'Preferred Supplier', accessor: (m) => m.preferredSupplier?.name || '-' },
        { header: 'Status', accessor: (m) => getMaterialStatus(m).label },
      ],
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Material Catalog</h1>
          <p className="text-slate-500 text-sm">Material master with reorder control and supplier preferences</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> Add Material
        </button>
      </div>

      {feedback.message && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="opacity-70 hover:opacity-100">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="bi bi-exclamation-triangle-fill text-red-500" />
            <span className="font-semibold text-red-800">{alerts.length} item{alerts.length > 1 ? 's' : ''} below reorder level</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 8).map((a) => (
              <span key={a._id} className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1">
                <i className="bi bi-arrow-down-circle-fill" />
                {a.name}: {a.currentStock} {a.uom} (min: {a.reorderLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-end">
            <button onClick={exportCsv} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <i className="bi bi-download" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by material, description, or supplier"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">UOM</label>
              <select value={uomFilter} onChange={(e) => setUomFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All UOMs</option>
                {UOMS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reorder Level</label>
              <select value={reorderFilter} onChange={(e) => setReorderFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All</option>
                <option value="at-risk">At or below reorder</option>
                <option value="healthy">Above reorder</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-500">Preferred Supplier</label>
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="bi bi-boxes text-4xl block mb-3 opacity-20" />
            <p className="mb-3">No materials match current filters.</p>
            <button onClick={openAdd} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Add First Material
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  {['Material Code', 'Material Name', 'Category', 'Unit of Measure', 'Reorder Level', 'Preferred Supplier', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m, idx) => {
                  const status = getMaterialStatus(m);
                  return (
                    <tr key={m._id} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">{m.materialCode || buildMaterialCode(m, (page - 1) * PAGE_SIZE + idx)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{m.name}</p>
                        {m.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{m.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CAT_COLORS[m.category] || CAT_COLORS.other}`}>
                          {m.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.uom}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {m.reorderLevel}
                        <span className="text-xs text-slate-400 ml-1">(stock: {m.currentStock})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.preferredSupplier?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => setDetailMaterial(m)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg">
                            <i className="bi bi-eye text-sm" />
                          </button>
                          <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <i className="bi bi-pencil text-sm" />
                          </button>
                          <button onClick={() => handleDelete(m._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <i className="bi bi-trash text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <p className="text-slate-500">Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} materials</p>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit' : 'New'} Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Material Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                    placeholder="e.g. Cotton Jersey 180 GSM"
                  />
                  {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
                  <select value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentStock}
                    onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.currentStock ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {fieldErrors.currentStock && <p className="text-xs text-red-600 mt-1">{fieldErrors.currentStock}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={form.reorderLevel}
                    onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.reorderLevel ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {fieldErrors.reorderLevel && <p className="text-xs text-red-600 mt-1">{fieldErrors.reorderLevel}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldErrors.unitPrice ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  />
                  {fieldErrors.unitPrice && <p className="text-xs text-red-600 mt-1">{fieldErrors.unitPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Supplier</label>
                  <select value={form.preferredSupplier} onChange={(e) => setForm((f) => ({ ...f, preferredSupplier: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">None</option>
                    {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Material specifications, composition, or remarks"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}
                {editing ? 'Update Material' : 'Create Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailMaterial && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailMaterial(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Material Details</h3>
              <button onClick={() => setDetailMaterial(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Material Code:</span> <span className="font-medium text-slate-800">{detailMaterial.materialCode || buildMaterialCode(detailMaterial, 0)}</span></p>
              <p><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{detailMaterial.name}</span></p>
              <p><span className="text-slate-500">Category:</span> <span className="text-slate-700 capitalize">{detailMaterial.category}</span></p>
              <p><span className="text-slate-500">UOM:</span> <span className="text-slate-700">{detailMaterial.uom}</span></p>
              <p><span className="text-slate-500">Current Stock:</span> <span className="text-slate-700">{detailMaterial.currentStock}</span></p>
              <p><span className="text-slate-500">Reorder Level:</span> <span className="text-slate-700">{detailMaterial.reorderLevel}</span></p>
              <p><span className="text-slate-500">Unit Price:</span> <span className="text-slate-700">Rs. {Number(detailMaterial.unitPrice || 0).toLocaleString()}</span></p>
              <p><span className="text-slate-500">Preferred Supplier:</span> <span className="text-slate-700">{detailMaterial.preferredSupplier?.name || '-'}</span></p>
              <p><span className="text-slate-500">Description:</span> <span className="text-slate-700">{detailMaterial.description || '-'}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
