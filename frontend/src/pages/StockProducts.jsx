import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createManufacturingProduct,
  getProducts,
  updateManufacturingProduct,
} from '../api/client';

const emptyForm = {
  name: '',
  sku: '',
  classification: 'normal',
  status: 'active',
  stockQty: 0,
};

function normalizeError(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

export default function StockProducts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const productsQuery = useQuery({
    queryKey: ['stock-products'],
    queryFn: () => getProducts().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: createManufacturingProduct,
    onSuccess: () => {
      setForm(emptyForm);
      setMessage('Product created successfully.');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
    },
    onError: (err) => {
      setMessage('');
      setError(normalizeError(err, 'Failed to create product.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateManufacturingProduct(id, data),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingId('');
      setMessage('Product updated successfully.');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
    },
    onError: (err) => {
      setMessage('');
      setError(normalizeError(err, 'Failed to update product.'));
    },
  });

  const products = productsQuery.data || [];

  const totals = useMemo(() => {
    const inStock = products.filter((p) => Number(p.stockQty || 0) > 0).length;
    const active = products.filter((p) => p.status === 'active').length;
    return {
      all: products.length,
      inStock,
      active,
    };
  }, [products]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      name: form.name,
      sku: form.sku,
      classification: form.classification,
      status: form.status,
      stockQty: Number(form.stockQty || 0),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      classification: product.classification || 'normal',
      status: product.status || 'active',
      stockQty: Number(product.stockQty || 0),
    });
    setError('');
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId('');
    setForm(emptyForm);
    setError('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-500 text-sm">Stock Control / Products</p>
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <p className="text-slate-500 text-sm mt-1">
          Create and manage finished products. Active products with stock are available in manufacturing line assignment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Products</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totals.all}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{totals.active}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">In Stock</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{totals.inStock}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {editingId ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Product name"
            className="px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <input
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU (optional)"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <select
            value={form.classification}
            onChange={(e) => setForm((prev) => ({ ...prev, classification: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="normal">Normal</option>
            <option value="damage">Damage</option>
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="number"
            min="0"
            value={form.stockQty}
            onChange={(e) => setForm((prev) => ({ ...prev, stockQty: e.target.value }))}
            placeholder="Stock qty"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />

          <div className="md:col-span-2 xl:col-span-5 flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Product List</h2>
        </div>
        {productsQuery.isLoading ? (
          <div className="p-6 text-slate-500">Loading products...</div>
        ) : productsQuery.isError ? (
          <div className="p-6 text-red-600">{normalizeError(productsQuery.error, 'Unable to load products.')}</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-slate-500">No products found. Create your first product above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Classification</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Stock Qty</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{product.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{product.classification}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : product.status === 'inactive'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{Number(product.stockQty || 0)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
