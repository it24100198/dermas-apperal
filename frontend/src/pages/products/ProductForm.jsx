import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createManufacturedProduct,
  updateManufacturedProduct,
  getManufacturedProduct,
  listProductCategories,
  listProductBrands,
  listProductUnits,
} from '../../api/client';

function generateSku() {
  const ts = Date.now().toString().slice(-6);
  const r = Math.floor(Math.random() * 900 + 100);
  return `MFG-${ts}-${r}`;
}

const EMPTY = {
  name: '', description: '', sku: '', barcode: '', image: '',
  categoryId: '', brandId: '', unitId: '',
  productType: 'finished',
  materialCost: '', laborCost: '', overheadCost: '', packagingCost: '', otherCost: '',
  sellingPrice: '',
  stockQty: '', openingStock: '', alertQuantity: '5',
  manageStock: true, trackStock: true,
  bomReference: '', batchNumberSupport: false, estimatedProductionTime: '', reorderLevel: '',
  weight: '', size: '',
  status: 'active', featured: false, allowDiscount: true, expirySupport: false, note: '',
};

function num(v) { return parseFloat(v) || 0; }

function CostInput({ label, name, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs.</span>
        <input
          type="number" min="0" step="0.01"
          name={name} value={value} onChange={onChange}
          placeholder="0.00"
          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Section({ title, icon, children, color = 'slate' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`px-5 py-3.5 border-b border-slate-100 bg-${color}-50 flex items-center gap-2`}>
        <i className={`bi ${icon} text-${color}-600`} />
        <h3 className={`font-semibold text-${color}-800 text-sm`}>{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const { data: categories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: () => listProductCategories().then(r => r.data) });
  const { data: brands = [] } = useQuery({ queryKey: ['product-brands'], queryFn: () => listProductBrands().then(r => r.data) });
  const { data: units = [] } = useQuery({ queryKey: ['product-units'], queryFn: () => listProductUnits().then(r => r.data) });

  const { data: existingProduct } = useQuery({
    queryKey: ['manufactured-product', id],
    queryFn: () => getManufacturedProduct(id).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProduct) {
      setForm({
        ...EMPTY,
        ...existingProduct,
        categoryId: existingProduct.categoryId?._id || existingProduct.categoryId || '',
        brandId: existingProduct.brandId?._id || existingProduct.brandId || '',
        unitId: existingProduct.unitId?._id || existingProduct.unitId || '',
        materialCost: existingProduct.materialCost ?? '',
        laborCost: existingProduct.laborCost ?? '',
        overheadCost: existingProduct.overheadCost ?? '',
        packagingCost: existingProduct.packagingCost ?? '',
        otherCost: existingProduct.otherCost ?? '',
        sellingPrice: existingProduct.sellingPrice ?? '',
        stockQty: existingProduct.stockQty ?? '',
        openingStock: existingProduct.openingStock ?? '',
        alertQuantity: existingProduct.alertQuantity ?? '5',
        reorderLevel: existingProduct.reorderLevel ?? '',
        weight: existingProduct.weight ?? '',
      });
    }
  }, [existingProduct]);

  const totalMfgCost = num(form.materialCost) + num(form.laborCost) + num(form.overheadCost) + num(form.packagingCost) + num(form.otherCost);
  const profitAmount = num(form.sellingPrice) - totalMfgCost;
  const profitMargin = num(form.sellingPrice) > 0 ? (profitAmount / num(form.sellingPrice)) * 100 : 0;

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors(err => ({ ...err, [name]: undefined }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.sellingPrice || num(form.sellingPrice) <= 0) e.sellingPrice = 'Selling price must be > 0';
    return e;
  };

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateManufacturedProduct(id, data)
      : createManufacturedProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufactured-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-summary'] });
      navigate('/products');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = {
      ...form,
      materialCost: num(form.materialCost),
      laborCost: num(form.laborCost),
      overheadCost: num(form.overheadCost),
      packagingCost: num(form.packagingCost),
      otherCost: num(form.otherCost),
      sellingPrice: num(form.sellingPrice),
      stockQty: num(form.stockQty),
      openingStock: num(form.openingStock),
      alertQuantity: num(form.alertQuantity),
      reorderLevel: num(form.reorderLevel),
      weight: form.weight !== '' ? num(form.weight) : null,
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      unitId: form.unitId || null,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <i className="bi bi-arrow-left text-lg" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-slate-500 text-sm">{isEdit ? 'Update manufactured product details' : 'Create a new manufactured product'}</p>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <i className="bi bi-exclamation-triangle mr-2" />
          {saveMutation.error?.response?.data?.error || saveMutation.error?.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Information */}
            <Section title="Basic Information" icon="bi-info-circle">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Premium Cotton T-Shirt"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-300'}`} />
                  {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description…"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Product Code</label>
                  <div className="flex gap-2">
                    <input name="sku" value={form.sku} onChange={handleChange} placeholder="Auto-generated if empty"
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, sku: generateSku() }))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
                      Auto SKU
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                  <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Barcode number"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                  <select name="productType" value={form.productType} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="finished">Finished Product</option>
                    <option value="semi_finished">Semi-Finished Product</option>
                    <option value="raw_linked">Raw Material Linked</option>
                    <option value="service">Service Item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Image URL</label>
                  <input name="image" value={form.image} onChange={handleChange} placeholder="https://... or leave blank"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </Section>

            {/* Manufacturing Cost */}
            <Section title="Manufacturing Cost Breakdown" icon="bi-calculator" color="amber">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <CostInput label="Material Cost" name="materialCost" value={form.materialCost} onChange={handleChange} hint="Raw material cost" />
                <CostInput label="Labor Cost" name="laborCost" value={form.laborCost} onChange={handleChange} hint="Worker wages per unit" />
                <CostInput label="Overhead Cost" name="overheadCost" value={form.overheadCost} onChange={handleChange} hint="Utilities, rent, etc." />
                <CostInput label="Packaging Cost" name="packagingCost" value={form.packagingCost} onChange={handleChange} />
                <CostInput label="Other Cost" name="otherCost" value={form.otherCost} onChange={handleChange} />
              </div>

              {/* Auto-calculated summary */}
              <div className="bg-slate-900 rounded-xl p-4 mt-2">
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div>
                    <p className="text-xs opacity-60 mb-1">Total Mfg Cost</p>
                    <p className="text-xl font-bold">Rs. {totalMfgCost.toLocaleString()}</p>
                    <p className="text-xs opacity-50">Auto-calculated</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60 mb-1">Selling Price <span className="text-red-400">*</span></p>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs.</span>
                      <input
                        type="number" min="0" step="0.01" name="sellingPrice" value={form.sellingPrice} onChange={handleChange}
                        placeholder="0.00"
                        className={`w-full pl-8 pr-2 py-1.5 bg-slate-700 border rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.sellingPrice ? 'border-red-400' : 'border-slate-600'}`}
                      />
                    </div>
                    {errors.sellingPrice && <p className="text-red-400 text-xs mt-0.5">{errors.sellingPrice}</p>}
                  </div>
                  <div>
                    <p className="text-xs opacity-60 mb-1">Profit / Margin</p>
                    <p className={`text-xl font-bold ${profitAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profitMargin.toFixed(1)}%
                    </p>
                    <p className={`text-xs ${profitAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Rs. {profitAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Stock */}
            <Section title="Stock Information" icon="bi-box-seam" color="emerald">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock</label>
                  <input type="number" min="0" name="openingStock" value={form.openingStock} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                  <input type="number" min="0" name="stockQty" value={form.stockQty} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alert Quantity</label>
                  <input type="number" min="0" name="alertQuantity" value={form.alertQuantity} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" name="reorderLevel" value={form.reorderLevel} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[['manageStock', 'Manage Stock'], ['trackStock', 'Track Stock']].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="w-4 h-4 rounded text-emerald-600" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </Section>

            {/* Production Info */}
            <Section title="Production Related Information" icon="bi-gear" color="indigo">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BOM Reference</label>
                  <input name="bomReference" value={form.bomReference} onChange={handleChange} placeholder="Bill of Materials ref"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Est. Production Time</label>
                  <input name="estimatedProductionTime" value={form.estimatedProductionTime} onChange={handleChange} placeholder="e.g. 2 hours"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input type="number" min="0" step="0.001" name="weight" value={form.weight} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Size / Color</label>
                  <input name="size" value={form.size} onChange={handleChange} placeholder="e.g. M, Red"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="batchNumberSupport" checked={form.batchNumberSupport} onChange={handleChange} className="w-4 h-4 rounded text-indigo-600" />
                <span className="text-sm text-slate-700">Enable batch number support</span>
              </label>
            </Section>

          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Categorization */}
            <Section title="Categorization" icon="bi-tags">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select name="categoryId" value={form.categoryId} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <select name="brandId" value={form.brandId} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select brand…</option>
                    {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select name="unitId" value={form.unitId} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select unit…</option>
                    {units.map(u => <option key={u._id} value={u._id}>{u.name} {u.abbreviation ? `(${u.abbreviation})` : ''}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {/* Status & Options */}
            <Section title="Status & Options" icon="bi-toggles">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {[['featured', 'Featured Product'], ['allowDiscount', 'Allow Discount'], ['expirySupport', 'Expiry Date Support']].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            {/* Note */}
            <Section title="Notes" icon="bi-sticky">
              <textarea name="note" value={form.note} onChange={handleChange} rows={4} placeholder="Internal notes about this product…"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </Section>

            {/* Image preview */}
            {form.image && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Image Preview</p>
                <img src={form.image} alt="preview" className="max-h-40 mx-auto rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-6">
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
            {saveMutation.isPending ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Saving…</>
            ) : (
              <><i className="bi bi-check-lg" /> {isEdit ? 'Update Product' : 'Create Product'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
