import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  listManufacturedProducts,
  deleteManufacturedProduct,
  getProductSummary,
  listProductCategories,
  listProductBrands,
} from '../../api/client';

function StockBadge({ qty, alert }) {
  if (qty === 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">Out of Stock</span>;
  if (qty <= alert) return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Low Stock</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">In Stock</span>;
}

function StatusBadge({ status }) {
  const map = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-100 text-slate-600', draft: 'bg-amber-100 text-amber-700' };
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export default function ProductList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [productTab, setProductTab] = useState('normal'); // normal | damage

  const params = { search, categoryId, brandId, status, stockStatus, page, limit: 20, classification: productTab };

  const { data, isLoading } = useQuery({
    queryKey: ['manufactured-products', params],
    queryFn: () => listManufacturedProducts(params).then(r => r.data),
  });
  const { data: summary } = useQuery({
    queryKey: ['product-summary'],
    queryFn: () => getProductSummary().then(r => r.data),
  });
  const { data: categories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: () => listProductCategories().then(r => r.data) });
  const { data: brands = [] } = useQuery({ queryKey: ['product-brands'], queryFn: () => listProductBrands().then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteManufacturedProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufactured-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-summary'] });
      setDeleteConfirm(null);
    },
  });

  const products = data?.products || [];
  const totalPages = data?.pages || 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(''); setSearchInput(''); setCategoryId(''); setBrandId(''); setStatus(''); setStockStatus(''); setPage(1);
  };

  const switchTab = (tab) => {
    setProductTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manufactured goods and damage stock from final checking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {productTab === 'normal' && (
            <>
              <Link to="/products/categories" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                <i className="bi bi-tags" /> Categories
              </Link>
              <Link to="/products/brands" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                <i className="bi bi-award" /> Brands
              </Link>
              <Link to="/products/units" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                <i className="bi bi-rulers" /> Units
              </Link>
              <Link to="/products/barcode-print" className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <i className="bi bi-printer-fill" /> Barcode print
              </Link>
              <Link to="/products/add" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                <i className="bi bi-plus-lg" /> Add Product
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchTab('normal')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            productTab === 'normal' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="bi bi-box-seam" /> Finished products
        </button>
        <button
          type="button"
          onClick={() => switchTab('damage')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            productTab === 'damage' ? 'bg-orange-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="bi bi-exclamation-octagon" /> Damage stock
        </button>
        <span className="text-xs text-slate-500 self-center ml-1">
          Damage items are created when QC damage batches are finalized; they stay on a separate tab.
        </span>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: summary.total, icon: 'bi-box-seam', color: 'indigo' },
            { label: 'Active', value: summary.active, icon: 'bi-check-circle', color: 'emerald' },
            { label: 'Low Stock', value: summary.lowStock, icon: 'bi-exclamation-triangle', color: 'amber' },
            { label: 'Out of Stock', value: summary.outOfStock, icon: 'bi-x-circle', color: 'red' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${c.color}-100 flex items-center justify-center`}>
                <i className={`bi ${c.icon} text-${c.color}-600 text-lg`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{c.value}</p>
                <p className="text-xs text-slate-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-slate-500 mb-1">Search</label>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Name, SKU, or barcode…"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-slate-500 mb-1">Brand</label>
            <select value={brandId} onChange={e => { setBrandId(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Brands</option>
              {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-xs text-slate-500 mb-1">Stock</label>
            <select value={stockStatus} onChange={e => { setStockStatus(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <i className="bi bi-search" /> Search
          </button>
          <button type="button" onClick={resetFilters} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
            Reset
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">{data?.total ?? 0} products found</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <i className="bi bi-box-seam text-5xl mb-3" />
            <p className="font-medium">No products found</p>
            {productTab === 'normal' ? (
              <Link to="/products/add" className="mt-3 text-indigo-600 text-sm hover:underline">Add your first product →</Link>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Damage SKUs appear here after you finalize damage batches in Final Checking.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Mfg Cost</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Margin</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          {p.image
                            ? <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg" />
                            : <i className="bi bi-box text-indigo-400" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{(p.productType || '').replace('_', ' ')}</p>
                          {p.classification === 'damage' && p.linkedGoodProductId?.name && (
                            <p className="text-xs text-orange-700 mt-0.5">From good: {p.linkedGoodProductId.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.categoryId?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">Rs. {(p.totalManufacturingCost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">Rs. {(p.sellingPrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.profitMargin >= 20 ? 'text-emerald-600' : p.profitMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {p.profitMargin?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-700">{p.stockQty}</span>
                        <StockBadge qty={p.stockQty} alert={p.alertQuantity} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setViewProduct(p)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="View">
                          <i className="bi bi-eye" />
                        </button>
                        <button onClick={() => navigate(`/products/edit/${p._id}`)} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors" title="Edit">
                          <i className="bi bi-pencil" />
                        </button>
                        <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title="Delete">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-trash text-red-600 text-xl" />
            </div>
            <h3 className="text-center font-semibold text-slate-800 mb-1">Delete Product?</h3>
            <p className="text-center text-sm text-slate-500 mb-5">
              <strong>{deleteConfirm.name}</strong> will be permanently deleted.
            </p>
            {deleteMutation.isError && <p className="text-red-600 text-sm text-center mb-3">{deleteMutation.error?.response?.data?.error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm._id)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProduct && <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} onEdit={() => { navigate(`/products/edit/${viewProduct._id}`); setViewProduct(null); }} />}
    </div>
  );
}

function ProductViewModal({ product: p, onClose, onEdit }) {
  const row = (label, value) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value ?? '—'}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Product Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><i className="bi bi-x-lg" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Top info */}
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              {p.image ? <img src={p.image} alt="" className="w-20 h-20 object-cover rounded-xl" /> : <i className="bi bi-box text-3xl text-indigo-300" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{p.description || 'No description'}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium capitalize">{(p.productType || '').replace('_', ' ')}</span>
                <StatusBadge status={p.status} />
                <StockBadge qty={p.stockQty} alert={p.alertQuantity} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic info */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Basic Info</h4>
              {row('SKU', p.sku)}
              {row('Barcode', p.barcode)}
              {row('Category', p.categoryId?.name)}
              {row('Brand', p.brandId?.name)}
              {row('Unit', p.unitId?.name)}
            </div>
            {/* Stock */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Stock</h4>
              {row('Current Stock', `${p.stockQty} ${p.unitId?.abbreviation || 'pcs'}`)}
              {row('Alert Quantity', p.alertQuantity)}
              {row('Reorder Level', p.reorderLevel)}
              {row('Manage Stock', p.manageStock ? 'Yes' : 'No')}
            </div>
            {/* Costs */}
            <div className="bg-amber-50 rounded-xl p-4 col-span-full">
              <h4 className="font-semibold text-amber-800 mb-3 text-sm uppercase tracking-wide">Manufacturing Cost Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['Material Cost', p.materialCost],
                  ['Labor Cost', p.laborCost],
                  ['Overhead Cost', p.overheadCost],
                  ['Packaging Cost', p.packagingCost],
                  ['Other Cost', p.otherCost],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800">Rs. {(val || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="bg-slate-800 text-white rounded-lg p-3">
                  <p className="text-xs opacity-70">Total Mfg Cost</p>
                  <p className="font-bold text-lg">Rs. {(p.totalManufacturingCost || 0).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-600 text-white rounded-lg p-3">
                  <p className="text-xs opacity-80">Selling Price</p>
                  <p className="font-bold text-lg">Rs. {(p.sellingPrice || 0).toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-3 text-white ${p.profitMargin >= 0 ? 'bg-indigo-600' : 'bg-red-600'}`}>
                  <p className="text-xs opacity-80">Profit Margin</p>
                  <p className="font-bold text-lg">{p.profitMargin?.toFixed(1)}%</p>
                  <p className="text-xs opacity-80">Rs. {(p.profitAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            {/* Production */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Production Info</h4>
              {row('BOM Reference', p.bomReference)}
              {row('Est. Production Time', p.estimatedProductionTime)}
              {row('Weight', p.weight ? `${p.weight} kg` : null)}
              {row('Size', p.size)}
              {row('Batch Support', p.batchNumberSupport ? 'Yes' : 'No')}
            </div>
            {/* Other */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Other</h4>
              {row('Featured', p.featured ? 'Yes' : 'No')}
              {row('Allow Discount', p.allowDiscount ? 'Yes' : 'No')}
              {row('Expiry Support', p.expirySupport ? 'Yes' : 'No')}
              {row('Note', p.note)}
              {row('Created', p.createdAt ? new Date(p.createdAt).toLocaleDateString() : null)}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">Close</button>
          <button onClick={onEdit} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <i className="bi bi-pencil mr-1.5" /> Edit Product
          </button>
        </div>
      </div>
    </div>
  );
}
