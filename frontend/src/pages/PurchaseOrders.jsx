import { useState, useEffect } from 'react';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, getSuppliers, getMaterials } from '../api/purchase';

const STATUS_ORDER = ['draft', 'sent', 'shipped', 'received', 'cancelled'];
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700', received: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const emptyForm = { supplier: '', expectedDeliveryDate: '', notes: '', items: [{ material: '', description: '', qty: 1, unitPrice: 0, totalPrice: 0 }] };

const handlePrint = (po) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>PO-${po.poNumber}</title>
    <style>body{font-family:sans-serif;padding:32px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#f5f5f5;} .header{display:flex;justify-content:space-between;margin-bottom:24px;}</style>
    </head><body>
    <div class="header"><div><h2>PURCHASE ORDER</h2><p><strong>${po.poNumber}</strong></p></div><div style="text-align:right"><p><strong>Supplier:</strong> ${po.supplier?.name || ''}</p><p>${po.supplier?.email || ''}</p><p><strong>Status:</strong> ${po.status}</p></div></div>
    <p><strong>Expected Delivery:</strong> ${po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB') : 'TBD'}</p>
    <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
    ${po.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.description}</td><td>${it.qty}</td><td>Rs. ${it.unitPrice?.toLocaleString()}</td><td>Rs. ${it.totalPrice?.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin-top:16px;text-align:right;font-size:18px"><strong>Total: Rs. ${po.totalAmount?.toLocaleString()}</strong></p>
    ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
    </body></html>`);
  win.document.close(); win.print();
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? { status: tab } : {};
      const [o, s, m] = await Promise.all([getPurchaseOrders(params), getSuppliers(), getMaterials()]);
      setOrders(o); setSuppliers(s); setMaterials(m);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);

  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'qty' || field === 'unitPrice') {
        items[i].totalPrice = Number(items[i].qty) * Number(items[i].unitPrice);
      }
      if (field === 'material') {
        const mat = materials.find(m => m._id === val);
        if (mat) { items[i].description = mat.name; items[i].unitPrice = mat.unitPrice || 0; items[i].totalPrice = Number(items[i].qty) * (mat.unitPrice || 0); }
      }
      return { ...f, items };
    });
  };

  const handleSave = async () => {
    if (!form.supplier) { setError('Select a supplier'); return; }
    if (form.items.some(it => !it.description.trim())) { setError('All items need a description'); return; }
    setSaving(true);
    try {
      await createPurchaseOrder(form);
      setShowModal(false); setForm(emptyForm); await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try { await updatePurchaseOrder(id, { status }); await load(); } catch { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try { await deletePurchaseOrder(id); await load(); } catch { }
  };

  const totalAmount = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-slate-500 text-sm">Track and manage all supplier orders</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New PO
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {['all', ...STATUS_ORDER].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
        : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <i className="bi bi-receipt text-5xl block mb-3 opacity-20" />No purchase orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(po => (
              <div key={po._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(expanded === po._id ? null : po._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{po.poNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status]}`}>{po.status}</span>
                      <span className="text-slate-500 text-sm">{po.supplier?.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(po.createdAt).toLocaleDateString('en-GB')}
                      {po.expectedDeliveryDate && ` · Delivery: ${new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">Rs. {po.totalAmount?.toLocaleString()}</span>
                    <select value={po.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(po._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={e => { e.stopPropagation(); handlePrint(po); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Print PDF">
                      <i className="bi bi-printer text-sm" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(po._id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <i className="bi bi-trash text-sm" />
                    </button>
                    <i className={`bi bi-chevron-down text-slate-400 transition-transform ${expanded === po._id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expanded === po._id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-slate-500">{['Description', 'Qty', 'Unit Price', 'Total'].map(h => <th key={h} className="text-left py-1 pr-4 font-medium">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {po.items.map((it, i) => (
                          <tr key={i} className="text-slate-700">
                            <td className="py-2 pr-4">{it.description}</td>
                            <td className="py-2 pr-4">{it.qty} {it.material?.uom || ''}</td>
                            <td className="py-2 pr-4">Rs. {it.unitPrice?.toLocaleString()}</td>
                            <td className="py-2 font-medium">Rs. {it.totalPrice?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {po.notes && <p className="text-xs text-slate-400 mt-2 italic">{po.notes}</p>}
                  </div>
                )}
              </div>
            ))}
            <div className="bg-indigo-50 rounded-xl px-4 py-3 flex justify-end">
              <span className="text-sm text-indigo-700 font-medium">Total (shown): <span className="font-bold text-indigo-900">Rs. {totalAmount.toLocaleString()}</span></span>
            </div>
          </div>
        )}

      {/* New PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">New Purchase Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                  <select value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select…</option>
                    {suppliers.filter(s => s.isActive).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
                  <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Order Items *</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { material: '', description: '', qty: 1, unitPrice: 0, totalPrice: 0 }] }))}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><i className="bi bi-plus" />Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select value={it.material} onChange={e => updateItem(i, 'material', e.target.value)}
                        className="col-span-4 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Material…</option>
                        {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                      <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description"
                        className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="number" min="1" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="Qty"
                        className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="number" min="0" value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="Price"
                        className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                        className="col-span-1 text-slate-400 hover:text-red-500 flex justify-center"><i className="bi bi-trash text-sm" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right text-sm font-semibold text-slate-700">
                  Total: Rs. {form.items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Create PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
