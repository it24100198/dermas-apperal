import { useState, useEffect } from 'react';
import { getSalesOrders, createSalesOrder, updateSalesOrder, deleteSalesOrder } from '../api/sales';

const PIPELINE = ['pending','confirmed','processing','dispatched','delivered','cancelled'];
const STATUS_COLORS = {
  pending:'bg-slate-100 text-slate-600', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-amber-100 text-amber-700', dispatched:'bg-indigo-100 text-indigo-700',
  delivered:'bg-emerald-100 text-emerald-700', cancelled:'bg-red-100 text-red-700',
};

const emptyForm = {
  customer: { name:'', email:'', phone:'', address:'' },
  items: [{ description:'', qty:1, unitPrice:0, costPrice:0, totalPrice:0 }],
  taxRate:0, deliveryDate:'', notes:'',
};

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try { const p = tab !== 'all' ? { status: tab } : {}; setOrders(await getSalesOrders(p)); }
    catch{} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);

  const updateItem = (i, f, v) => setForm(frm => {
    const items = [...frm.items];
    items[i] = { ...items[i], [f]: v };
    if (f==='qty'||f==='unitPrice') items[i].totalPrice = Number(items[i].qty)*Number(items[i].unitPrice);
    return { ...frm, items };
  });

  const handleSave = async () => {
    if (!form.customer.name.trim()) { setError('Customer name required'); return; }
    setSaving(true);
    try { await createSalesOrder(form); setShowModal(false); await load(); }
    catch (e) { setError(e?.response?.data?.error||'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => {
    try { await updateSalesOrder(id, { status }); await load(); } catch{}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await deleteSalesOrder(id); await load(); } catch{}
  };

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount||0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Sales Orders</h1>
          <p className="text-slate-500 text-sm">Track confirmed orders through the fulfilment pipeline</p></div>
        <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {['all','pending','confirmed','processing','dispatched','delivered'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab===t?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
        : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <i className="bi bi-bag text-5xl block mb-3 opacity-20" />No sales orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(expanded===o._id?null:o._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-purple-700">{o.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                      <span className="text-slate-600 font-medium">{o.customer.name}</span>
                      {o.quotation && <span className="text-xs text-slate-400">← {o.quotation.quoteNumber}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString('en-GB')}
                      {o.deliveryDate && ` · Delivery: ${new Date(o.deliveryDate).toLocaleDateString('en-GB')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">Rs. {o.totalAmount?.toLocaleString()}</span>
                    <select value={o.status} onClick={e=>e.stopPropagation()} onChange={e=>handleStatus(o._id,e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {PIPELINE.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={e=>{e.stopPropagation();handleDelete(o._id)}} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><i className="bi bi-trash text-sm" /></button>
                    <i className={`bi bi-chevron-down text-slate-400 transition-transform ${expanded===o._id?'rotate-180':''}`} />
                  </div>
                </div>
                {expanded===o._id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div><p className="text-slate-500 text-xs">Customer</p><p className="font-medium text-slate-800">{o.customer.name}</p><p className="text-xs text-slate-400">{o.customer.email} · {o.customer.phone}</p></div>
                      <div><p className="text-slate-500 text-xs">Address</p><p className="text-slate-600">{o.customer.address||'—'}</p></div>
                    </div>
                    <table className="w-full text-sm"><thead><tr className="text-xs text-slate-400">{['Item','Qty','Unit Price','Cost','Total'].map(h=><th key={h} className="text-left py-1 pr-4 font-medium">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {o.items.map((it,i)=>(
                          <tr key={i} className="text-slate-700">
                            <td className="py-2 pr-4">{it.description}</td>
                            <td className="py-2 pr-4">{it.qty}</td>
                            <td className="py-2 pr-4">Rs. {it.unitPrice?.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-slate-400">Rs. {it.costPrice?.toLocaleString()}</td>
                            <td className="py-2 font-medium">Rs. {it.totalPrice?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right mt-2 text-sm"><span className="text-slate-500">Tax ({o.taxRate}%): Rs. {o.taxAmount?.toLocaleString()} &nbsp;|&nbsp;</span><strong className="text-slate-800">Total: Rs. {o.totalAmount?.toLocaleString()}</strong></div>
                    {o.notes && <p className="text-xs text-slate-400 mt-2 italic">{o.notes}</p>}
                  </div>
                )}
              </div>
            ))}
            <div className="bg-purple-50 rounded-xl px-4 py-3 flex justify-end">
              <span className="text-sm text-purple-700">Total Revenue (shown): <strong className="text-purple-900">Rs. {totalRevenue.toLocaleString()}</strong></span>
            </div>
          </div>
        )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10">
              <h3 className="font-semibold text-slate-800">New Sales Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                {[['name','Customer Name *'],['email','Email'],['phone','Phone'],['address','Address']].map(([k,l])=>(
                  <div key={k} className={k==='address'?'col-span-2':''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{l}</label>
                    <input value={form.customer[k]} onChange={e=>setForm(f=>({...f,customer:{...f.customer,[k]:e.target.value}}))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium">
                  <span className="col-span-4">Description</span><span className="col-span-2">Qty</span>
                  <span className="col-span-2">Unit Price</span><span className="col-span-2">Cost Price</span><span className="col-span-2">Total</span>
                </div>
                {form.items.map((it,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={it.description} onChange={e=>updateItem(i,'description',e.target.value)} className="col-span-4 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Item name"/>
                    <input type="number" min="1" value={it.qty} onChange={e=>updateItem(i,'qty',e.target.value)} className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <input type="number" min="0" value={it.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <input type="number" min="0" value={it.costPrice} onChange={e=>updateItem(i,'costPrice',e.target.value)} className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Cost"/>
                    <p className="col-span-1 text-xs text-slate-600">{Number(it.totalPrice).toLocaleString()}</p>
                    <button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}))} className="col-span-1 text-slate-400 hover:text-red-500 text-sm flex justify-center"><i className="bi bi-trash"/></button>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,items:[...f.items,{description:'',qty:1,unitPrice:0,costPrice:0,totalPrice:0}]}))}
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1"><i className="bi bi-plus"/>Add Item</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input type="number" min="0" value={form.taxRate} onChange={e=>setForm(f=>({...f,taxRate:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Delivery Date</label>
                  <input type="date" value={form.deliveryDate} onChange={e=>setForm(f=>({...f,deliveryDate:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
