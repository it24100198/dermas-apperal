import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  listProductCategories, createProductCategory, updateProductCategory, deleteProductCategory,
  listProductBrands, createProductBrand, updateProductBrand, deleteProductBrand,
  listProductUnits, createProductUnit, updateProductUnit, deleteProductUnit,
} from '../../api/client';

function MetaPanel({ title, icon, queryKey, listFn, createFn, updateFn, deleteFn, extraField }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: () => listFn().then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? updateFn(editing._id, data) : createFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setShowForm(false); setEditing(null); setName(''); setExtra('');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteConfirm(null);
    },
  });

  const openEdit = (item) => {
    setEditing(item); setName(item.name); setExtra(item[extraField?.field] || ''); setShowForm(true);
  };
  const openAdd = () => {
    setEditing(null); setName(''); setExtra(''); setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data = { name: name.trim() };
    if (extraField) data[extraField.field] = extra;
    saveMutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`bi ${icon} text-indigo-600`} />
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
          <i className="bi bi-plus-lg" /> Add
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
          <p className="text-sm font-medium text-indigo-800 mb-3">{editing ? 'Edit' : 'Add New'} {title.replace(/s$/, '')}</p>
          <div className="flex gap-2 flex-wrap">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *"
              className="flex-1 min-w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {extraField && (
              <input value={extra} onChange={e => setExtra(e.target.value)} placeholder={extraField.placeholder}
                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
            <button onClick={handleSave} disabled={saveMutation.isPending || !name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium">
              {saveMutation.isPending ? 'Saving…' : (editing ? 'Update' : 'Save')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
          {saveMutation.isError && <p className="text-red-600 text-xs mt-2">{saveMutation.error?.response?.data?.error}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">No {title.toLowerCase()} yet. Add one above.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item._id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                {extraField && item[extraField.field] && (
                  <p className="text-xs text-slate-500 mt-0.5">{extraField.label}: {item[extraField.field]}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"><i className="bi bi-pencil text-sm" /></button>
                <button onClick={() => setDeleteConfirm(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><i className="bi bi-trash text-sm" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <i className="bi bi-trash text-red-600" />
            </div>
            <p className="font-semibold text-slate-800 mb-1">Delete "{deleteConfirm.name}"?</p>
            <p className="text-sm text-slate-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm._id)} disabled={deleteMutation.isPending} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCategories() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><i className="bi bi-arrow-left text-lg" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Categories</h1>
          <p className="text-slate-500 text-sm">Manage categories for manufactured products</p>
        </div>
      </div>
      <MetaPanel title="Categories" icon="bi-tags" queryKey="product-categories"
        listFn={listProductCategories} createFn={createProductCategory} updateFn={updateProductCategory} deleteFn={deleteProductCategory}
      />
    </div>
  );
}

export function ProductBrands() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><i className="bi bi-arrow-left text-lg" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Brands</h1>
          <p className="text-slate-500 text-sm">Manage brands for manufactured products</p>
        </div>
      </div>
      <MetaPanel title="Brands" icon="bi-award" queryKey="product-brands"
        listFn={listProductBrands} createFn={createProductBrand} updateFn={updateProductBrand} deleteFn={deleteProductBrand}
      />
    </div>
  );
}

export function ProductUnits() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><i className="bi bi-arrow-left text-lg" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Units</h1>
          <p className="text-slate-500 text-sm">Manage measurement units for manufactured products</p>
        </div>
      </div>
      <MetaPanel title="Units" icon="bi-rulers" queryKey="product-units"
        listFn={listProductUnits} createFn={createProductUnit} updateFn={updateProductUnit} deleteFn={deleteProductUnit}
        extraField={{ field: 'abbreviation', placeholder: 'Abbr (pcs)', label: 'Abbreviation' }}
      />
    </div>
  );
}
