import { useState, useEffect } from 'react';
import { getStockHistory } from '../api/stock';
import { getMaterials } from '../api/purchase';

const MOVEMENT_TYPES = ['grn', 'adjustment_add', 'adjustment_sub', 'issuance', 'manual'];
const TYPE_CONFIG = {
  grn:            { label: 'GRN',         color: 'bg-emerald-100 text-emerald-700', icon: 'bi-box-arrow-in-down', sign: '+' },
  adjustment_add: { label: 'Adj +',       color: 'bg-blue-100 text-blue-700',       icon: 'bi-plus-circle-fill', sign: '+' },
  adjustment_sub: { label: 'Adj −',       color: 'bg-orange-100 text-orange-700',   icon: 'bi-dash-circle-fill', sign: '−' },
  issuance:       { label: 'Issuance',    color: 'bg-red-100 text-red-700',         icon: 'bi-box-arrow-right',  sign: '−' },
  manual:         { label: 'Manual',      color: 'bg-slate-100 text-slate-600',     icon: 'bi-pencil-fill',      sign: '±' },
};

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ material: '', movementType: '', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.material)     params.material     = filters.material;
      if (filters.movementType) params.movementType = filters.movementType;
      if (filters.from)         params.from         = filters.from;
      if (filters.to)           params.to           = filters.to;
      const [movs, mats] = await Promise.all([getStockHistory(params), getMaterials()]);
      setMovements(movs); setMaterials(mats);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stockIn  = movements.filter(m => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
  const stockOut = movements.filter(m => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Stock History</h1>
        <p className="text-slate-500 text-sm">Complete audit trail of all inventory movements</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Movements', value: movements.length, icon: 'bi-activity', color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Total Stock In',  value: stockIn.toLocaleString(),  icon: 'bi-arrow-down-circle-fill', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Stock Out', value: stockOut.toLocaleString(), icon: 'bi-arrow-up-circle-fill',   color: 'text-red-600 bg-red-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
              <i className={`bi ${c.icon} text-xl`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{loading ? '…' : c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Material</label>
          <select value={filters.material} onChange={e => setFilters(f => ({ ...f, material: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Materials</option>
            {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <select value={filters.movementType} onChange={e => setFilters(f => ({ ...f, movementType: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            {MOVEMENT_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t]?.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-search" /> Filter
        </button>
        <button onClick={() => { setFilters({ material: '', movementType: '', from: '', to: '' }); setTimeout(load, 0); }}
          className="px-4 py-2 text-slate-600 text-sm rounded-lg hover:bg-slate-100 border border-slate-200">
          Clear
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
          : movements.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="bi bi-clock-history text-5xl block mb-3 opacity-20" />No stock movements match your filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Date & Time', 'Material', 'Type', 'Quantity', 'Before → After', 'Reference', 'Performed By', 'Note'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => {
                  const cfg = TYPE_CONFIG[m.movementType] || TYPE_CONFIG.manual;
                  const isIn = m.quantity > 0;
                  return (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        <p>{new Date(m.createdAt).toLocaleDateString('en-GB')}</p>
                        <p>{new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.material?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${cfg.color}`}>
                          <i className={`bi ${cfg.icon} text-xs`} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-base ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIn ? '+' : ''}{m.quantity} <span className="text-xs font-normal text-slate-400">{m.material?.uom}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {m.stockBefore} → <strong className="text-slate-800">{m.stockAfter}</strong>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {m.referenceId ? (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{m.referenceType}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{m.performedBy || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[160px] truncate">{m.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
