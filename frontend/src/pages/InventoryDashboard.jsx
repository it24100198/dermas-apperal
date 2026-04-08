import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStockOverview, getStockHistory } from '../api/stock';
import {
  getMaterials,
  createManufacturingMaterial,
  updateManufacturingMaterial,
} from '../api/client';

const emptyMfgForm = {
  name: '',
  type: 'fabric',
  stockQty: '',
  unit: 'm',
  unitPrice: '',
};

const MATERIAL_TYPES = [
  { value: 'fabric', label: 'Fabric' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'etc', label: 'Other' },
];

export default function InventoryDashboard() {
  const qc = useQueryClient();
  const [mfgModal, setMfgModal] = useState(false);
  const [mfgEditing, setMfgEditing] = useState(null);
  const [mfgForm, setMfgForm] = useState(emptyMfgForm);
  const [mfgError, setMfgError] = useState('');

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['stock-overview'],
    queryFn: () => getStockOverview(),
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['stock-history', 'recent'],
    queryFn: () => getStockHistory({}),
  });

  const { data: mfgMaterials = [], isLoading: loadingMfg } = useQuery({
    queryKey: ['materials'],
    queryFn: () => getMaterials().then((r) => r.data),
  });

  const recent = useMemo(() => (history || []).slice(0, 12), [history]);

  const createMfg = useMutation({
    mutationFn: (body) => createManufacturingMaterial(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['stock-overview'] });
      setMfgModal(false);
      setMfgEditing(null);
      setMfgForm(emptyMfgForm);
      setMfgError('');
    },
    onError: (e) => setMfgError(e.response?.data?.error || e.message),
  });

  const updateMfg = useMutation({
    mutationFn: ({ id, body }) => updateManufacturingMaterial(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['stock-overview'] });
      setMfgModal(false);
      setMfgEditing(null);
      setMfgForm(emptyMfgForm);
      setMfgError('');
    },
    onError: (e) => setMfgError(e.response?.data?.error || e.message),
  });

  const openNewMfg = () => {
    setMfgEditing(null);
    setMfgForm(emptyMfgForm);
    setMfgError('');
    setMfgModal(true);
  };

  const openEditMfg = (row) => {
    setMfgEditing(row);
    setMfgForm({
      name: row.name || '',
      type: row.type || 'fabric',
      stockQty: String(row.stockQty ?? ''),
      unit: row.unit || 'm',
      unitPrice: String(row.unitPrice ?? 0),
    });
    setMfgError('');
    setMfgModal(true);
  };

  const submitMfg = (e) => {
    e.preventDefault();
    setMfgError('');
    const body = {
      name: mfgForm.name.trim(),
      type: mfgForm.type,
      stockQty: Number(mfgForm.stockQty) || 0,
      unit: mfgForm.unit.trim() || 'm',
      unitPrice: Number(mfgForm.unitPrice) || 0,
    };
    if (!body.name) {
      setMfgError('Name is required');
      return;
    }
    if (mfgEditing) updateMfg.mutate({ id: mfgEditing._id, body });
    else createMfg.mutate(body);
  };

  const totalItemsDisplay =
    overview?.totalItemsAll != null ? overview.totalItemsAll : overview?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inventory Dashboard</h1>
        <p className="text-slate-500 text-sm">
          Purchase stock movements below. Manufacturing raw materials (fabric / accessories used in jobs) can be added with unit price here — the same list is used under Material issue (Create Job).
        </p>
      </div>

      {loadingOverview ? (
        <p className="text-slate-500">Loading inventory summary...</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total SKUs" value={totalItemsDisplay} icon="bi-boxes" />
          <Card title="Inventory value (Rs.)" value={(overview?.totalValue || 0).toLocaleString()} icon="bi-currency-dollar" />
          <Card title="Low stock (catalog)" value={overview?.lowStock ?? 0} icon="bi-exclamation-triangle" warn />
          <Card title="Out of stock (catalog)" value={overview?.outOfStock ?? 0} icon="bi-x-octagon" danger />
        </div>
      )}

      {!loadingOverview && overview && (
        <p className="text-xs text-slate-500 -mt-2">
          Value includes purchase catalog (Rs. {(overview.catalogValue || 0).toLocaleString()}) and manufacturing raw stock (Rs.{' '}
          {(overview.manufacturingRawValue || 0).toLocaleString()}, {overview.manufacturingRawItems ?? 0} items).
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-800">Manufacturing raw materials</h2>
            <p className="text-xs text-slate-500 mt-0.5">Used when creating jobs (fabric issue). Set stock and unit price (LKR per m, pcs, etc.).</p>
          </div>
          <button
            type="button"
            onClick={openNewMfg}
            className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
          >
            + Add raw material
          </button>
        </div>
        {loadingMfg ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : mfgMaterials.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">No manufacturing materials yet. Add fabric or accessories above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Unit price (Rs.)</th>
                  <th className="px-4 py-3">Line value (Rs.)</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {mfgMaterials.map((m) => {
                  const lineVal = (m.stockQty || 0) * (m.unitPrice || 0);
                  return (
                    <tr key={m._id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 capitalize">{m.type}</td>
                      <td className="px-4 py-3">{m.stockQty}</td>
                      <td className="px-4 py-3">{m.unit}</td>
                      <td className="px-4 py-3">{(m.unitPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{lineVal.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button type="button" className="text-amber-700 hover:underline text-xs" onClick={() => openEditMfg(m)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mfgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{mfgEditing ? 'Edit raw material' : 'Add raw material'}</h3>
            <form onSubmit={submitMfg} className="space-y-3">
              {mfgError && <p className="text-sm text-red-600">{mfgError}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={mfgForm.name}
                  onChange={(e) => setMfgForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={mfgForm.type}
                  onChange={(e) => setMfgForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock qty</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={mfgForm.stockQty}
                    onChange={(e) => setMfgForm((f) => ({ ...f, stockQty: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="m, pcs, kg…"
                    value={mfgForm.unit}
                    onChange={(e) => setMfgForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unit price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={mfgForm.unitPrice}
                  onChange={(e) => setMfgForm((f) => ({ ...f, unitPrice: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2 border border-slate-200 rounded-lg"
                  onClick={() => { setMfgModal(false); setMfgEditing(null); setMfgError(''); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMfg.isPending || updateMfg.isPending}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
                >
                  {mfgEditing ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent inventory movements (purchase catalog)</h2>
          {loadingHistory && <span className="text-sm text-slate-500">Loading...</span>}
        </div>
        {!loadingHistory && recent.length === 0 ? (
          <p className="p-6 text-slate-500 text-center">No inventory movements yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{m.material?.name || '—'}</td>
                  <td className="px-4 py-3">{m.movementType}</td>
                  <td className={`px-4 py-3 ${m.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.quantity >= 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="px-4 py-3">{m.stockBefore} → {m.stockAfter}</td>
                  <td className="px-4 py-3">{m.performedBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, icon, warn, danger }) {
  const color = danger
    ? 'text-red-700 bg-red-50'
    : warn
      ? 'text-amber-700 bg-amber-50'
      : 'text-slate-700 bg-slate-50';
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <i className={`bi ${icon} text-lg`} />
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
