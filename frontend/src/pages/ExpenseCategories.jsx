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
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm = {
  name: '',
  type: 'other',
  description: '',
  isRecurring: false,
  recurringDay: '',
  parentCategory: '',
  status: 'active',
};

function normalizeStatus(cat) {
  return cat.status === 'inactive' ? 'inactive' : 'active';
}

function statusBadge(status) {
  if (status === 'inactive') return 'bg-slate-200 text-slate-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function ExpenseCategories() {
  const [masters, setMasters] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubcat, setIsSubcat] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [search, setSearch] = useState('');
  const [masterStatusFilter, setMasterStatusFilter] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('');
  const [masterTypeFilter, setMasterTypeFilter] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [masterPage, setMasterPage] = useState(1);
  const [subPage, setSubPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const all = await getCategories();
      const nextMasters = all.filter((c) => !c.parentCategory);
      const nextSubs = all.filter((c) => c.parentCategory);
      setMasters(nextMasters);
      setSubs(nextSubs);
      if (!selectedMasterId && nextMasters.length) {
        setSelectedMasterId(nextMasters[0]._id);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setMasterPage(1);
  }, [search, masterStatusFilter, masterTypeFilter]);

  useEffect(() => {
    setSubPage(1);
  }, [search, subStatusFilter, selectedMasterId]);

  useEffect(() => {
    if (!masters.length) {
      setSelectedMasterId('');
      return;
    }
    const stillExists = masters.some((m) => m._id === selectedMasterId);
    if (!stillExists) {
      setSelectedMasterId(masters[0]._id);
    }
  }, [masters, selectedMasterId]);

  const openAdd = (sub = false) => {
    setIsSubcat(sub);
    setEditing(null);
    setForm({
      ...emptyForm,
      parentCategory: sub ? selectedMasterId || '' : '',
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat, sub) => {
    setIsSubcat(sub);
    setEditing(cat._id);
    setForm({
      name: cat.name,
      type: cat.type || 'other',
      description: cat.description || '',
      isRecurring: !!cat.isRecurring,
      recurringDay: cat.recurringDay || '',
      parentCategory: cat.parentCategory?._id || cat.parentCategory || '',
      status: normalizeStatus(cat),
    });
    setFieldErrors({});
    setError('');
    setShowModal(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Category name is required';
    if (!isSubcat && !form.type) nextErrors.type = 'Category type is required';
    if (isSubcat && !form.parentCategory) nextErrors.parentCategory = 'Parent category is required';
    if (!form.status) nextErrors.status = 'Status is required';
    if (!isSubcat && form.isRecurring && !form.recurringDay) {
      nextErrors.recurringDay = 'Recurring day is required for recurring categories';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please resolve the form errors and try again');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isSubcat) {
        delete payload.type;
        delete payload.isRecurring;
        delete payload.recurringDay;
      } else {
        delete payload.parentCategory;
      }

      if (!payload.isRecurring) payload.recurringDay = null;

      if (editing) await updateCategory(editing, payload);
      else await createCategory(payload);
      setShowModal(false);
      setFieldErrors({});
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategory(id); await load(); } catch { }
  };

  const getMasterName = (sub) => {
    const parent = masters.find(m => m._id === (sub.parentCategory?._id || sub.parentCategory));
    return parent?.name || '—';
  };

  const getMasterId = (sub) => sub.parentCategory?._id || sub.parentCategory || '';

  const q = search.trim().toLowerCase();

  const filteredMasters = masters.filter((cat) => {
    const text = `${cat.name} ${cat.description || ''}`.toLowerCase();
    const matchesSearch = !q || text.includes(q);
    const matchesStatus = !masterStatusFilter || normalizeStatus(cat) === masterStatusFilter;
    const matchesType = !masterTypeFilter || cat.type === masterTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredSubs = subs.filter((cat) => {
    const text = `${cat.name} ${cat.description || ''} ${getMasterName(cat)}`.toLowerCase();
    const matchesSearch = !q || text.includes(q);
    const matchesMaster = !selectedMasterId || getMasterId(cat) === selectedMasterId;
    const matchesStatus = !subStatusFilter || normalizeStatus(cat) === subStatusFilter;
    return matchesSearch && matchesMaster && matchesStatus;
  });

  const masterTotalPages = Math.max(1, Math.ceil(filteredMasters.length / PAGE_SIZE));
  const subTotalPages = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));
  const safeMasterPage = Math.min(masterPage, masterTotalPages);
  const safeSubPage = Math.min(subPage, subTotalPages);

  const pagedMasters = filteredMasters.slice((safeMasterPage - 1) * PAGE_SIZE, safeMasterPage * PAGE_SIZE);
  const pagedSubs = filteredSubs.slice((safeSubPage - 1) * PAGE_SIZE, safeSubPage * PAGE_SIZE);

  const masterRangeStart = filteredMasters.length ? (safeMasterPage - 1) * PAGE_SIZE + 1 : 0;
  const masterRangeEnd = Math.min(safeMasterPage * PAGE_SIZE, filteredMasters.length);
  const subRangeStart = filteredSubs.length ? (safeSubPage - 1) * PAGE_SIZE + 1 : 0;
  const subRangeEnd = Math.min(safeSubPage * PAGE_SIZE, filteredSubs.length);

  const selectedMaster = masters.find((m) => m._id === selectedMasterId);
  const selectedMasterSubCount = subs.filter((s) => getMasterId(s) === selectedMasterId).length;

  const onFormFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expense Categories</h1>
          <p className="text-slate-500 text-sm">Manage master categories and related sub-categories with status and recurrence settings.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <div className="xl:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Search category name</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search master or sub-category..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Master Type</label>
            <select
              value={masterTypeFilter}
              onChange={(e) => setMasterTypeFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Master Status</label>
            <select
              value={masterStatusFilter}
              onChange={(e) => setMasterStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sub-Category Status</label>
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

          {selectedMaster && (
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">Selected Master</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                {selectedMaster.name}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(normalizeStatus(selectedMaster))}`}>
                  {normalizeStatus(selectedMaster) === 'active' ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-slate-500">{selectedMasterSubCount} sub-categories</span>
              </p>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading…</div>
          ) : filteredMasters.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No master categories found for current filters.</div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {pagedMasters.map((cat) => {
                  const isSelected = selectedMasterId === cat._id;
                  const subCount = subs.filter((s) => getMasterId(s) === cat._id).length;
                  return (
                <li
                  key={cat._id}
                  onClick={() => setSelectedMasterId(cat._id)}
                  className={`px-5 py-3 flex items-center gap-3 group cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{cat.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(normalizeStatus(cat))}`}>
                        {normalizeStatus(cat) === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                        {TYPE_OPTIONS.find(t => t.value === cat.type)?.label || cat.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {subCount} sub-categories
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
                  );
                })}
              </ul>
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-sm">
                <p className="text-slate-600">Showing {masterRangeStart}–{masterRangeEnd} of {filteredMasters.length}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMasterPage((p) => Math.max(1, p - 1))}
                    disabled={safeMasterPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-500">Page {safeMasterPage} of {masterTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setMasterPage((p) => Math.min(masterTotalPages, p + 1))}
                    disabled={safeMasterPage === masterTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

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

          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 text-sm text-slate-600">
            {selectedMaster ? (
              <span>Showing sub-categories for <span className="font-semibold text-slate-800">{selectedMaster.name}</span></span>
            ) : (
              <span>Select a master category to focus related sub-categories.</span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading…</div>
          ) : filteredSubs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No sub-categories found for current filters.</div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {pagedSubs.map((cat) => (
                <li key={cat._id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{cat.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(normalizeStatus(cat))}`}>
                        {normalizeStatus(cat) === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <i className="bi bi-arrow-return-right" /> under <span className="font-medium text-slate-600 ml-1">{getMasterName(cat)}</span>
                    </p>
                    {cat.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{cat.description}</p>}
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
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-sm">
                <p className="text-slate-600">Showing {subRangeStart}–{subRangeEnd} of {filteredSubs.length}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                    disabled={safeSubPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-500">Page {safeSubPage} of {subTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setSubPage((p) => Math.min(subTotalPages, p + 1))}
                    disabled={safeSubPage === subTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{isSubcat ? 'Sub-Category Name' : 'Category Name'} *</label>
                <input value={form.name} onChange={e => onFormFieldChange('name', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={isSubcat ? 'e.g. Diesel Generator Service' : 'e.g. Utilities'} />
                {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>

              {isSubcat && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category *</label>
                  <select value={form.parentCategory} onChange={e => onFormFieldChange('parentCategory', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select…</option>
                    {masters.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  {fieldErrors.parentCategory && <p className="text-xs text-red-600 mt-1">{fieldErrors.parentCategory}</p>}
                </div>
              )}

              {!isSubcat && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category Type *</label>
                  <select value={form.type} onChange={e => onFormFieldChange('type', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {fieldErrors.type && <p className="text-xs text-red-600 mt-1">{fieldErrors.type}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => onFormFieldChange('description', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional description" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => onFormFieldChange('status', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                {fieldErrors.status && <p className="text-xs text-red-600 mt-1">{fieldErrors.status}</p>}
              </div>

              {!isSubcat && (
                <div className="space-y-3 bg-amber-50 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isRecurring}
                      onChange={e => onFormFieldChange('isRecurring', e.target.checked)}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-medium text-amber-800">Recurring monthly expense</span>
                  </label>
                  {form.isRecurring && (
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Due on day of month</label>
                      <select value={form.recurringDay} onChange={e => onFormFieldChange('recurringDay', e.target.value)}
                        className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">Select day…</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {fieldErrors.recurringDay && <p className="text-xs text-red-600 mt-1">{fieldErrors.recurringDay}</p>}
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
