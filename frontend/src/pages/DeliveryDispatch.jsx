import { useState, useEffect } from 'react';
import { getDeliveryOrders, createDeliveryOrder, updateDeliveryOrder, deleteDeliveryOrder, getSalesOrders } from '../api/sales';

const STAGES = ['pending','packed','shipped','delivered'];
const STAGE_ICON = { pending:'bi-clock', packed:'bi-box-seam', shipped:'bi-truck', delivered:'bi-check-circle-fill' };
const STAGE_COLOR = { pending:'text-slate-400', packed:'text-amber-500', shipped:'text-blue-500', delivered:'text-emerald-500' };
const STATUS_COLORS = { pending:'bg-slate-100 text-slate-600', packed:'bg-amber-100 text-amber-700', shipped:'bg-blue-100 text-blue-700', delivered:'bg-emerald-100 text-emerald-700' };

export default function DeliveryDispatch() {
  const [orders, setOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ salesOrder:'', customer:{name:'',phone:'',address:''}, driver:'', vehicle:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const [dos, sos] = await Promise.all([getDeliveryOrders(), getSalesOrders()]); setOrders(dos); setSalesOrders(sos); }
    catch{} finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const handleSOSelect = (soId) => {
    const so = salesOrders.find(o=>o._id===soId);
    if(so) setForm(f=>({...f,salesOrder:soId,customer:{name:so.customer.name,phone:so.customer.phone||'',address:so.customer.address||''}}));
    else setForm(f=>({...f,salesOrder:soId}));
  };

  const handleSave = async () => {
    if(!form.salesOrder){setError('Select a Sales Order');return;}
    setSaving(true);
    try{await createDeliveryOrder(form);setShowModal(false);await load();}
    catch(e){setError(e?.response?.data?.error||'Failed');}
    finally{setSaving(false);}
  };

  const handleStatus = async (id, status) => {
    try{await updateDeliveryOrder(id,{status});await load();}catch{}
  };

  const handleAssign = async (id, driver, vehicle) => {
    try{await updateDeliveryOrder(id,{driver,vehicle});await load();}catch{}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Delivery & Dispatch</h1>
          <p className="text-slate-500 text-sm">Issue delivery orders and track dispatch status</p></div>
        <button onClick={()=>{setForm({salesOrder:'',customer:{name:'',phone:'',address:''},driver:'',vehicle:'',notes:''});setError('');setShowModal(true);}}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <i className="bi bi-plus-lg"/>New DO
        </button>
      </div>

      {/* Stage Summary */}
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map(s=>(
          <div key={s} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <i className={`bi ${STAGE_ICON[s]} text-2xl ${STAGE_COLOR[s]}`}/>
            <p className="text-2xl font-bold text-slate-800 mt-1">{orders.filter(o=>o.status===s).length}</p>
            <p className="text-xs text-slate-500 capitalize">{s}</p>
          </div>
        ))}
      </div>

      {loading?<div className="p-12 text-center text-slate-400">Loading…</div>
        :orders.length===0?<div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"><i className="bi bi-truck text-5xl block mb-3 opacity-20"/>No delivery orders yet.</div>
        :(
          <div className="space-y-3">
            {orders.map(o=>(
              <div key={o._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-purple-700">{o.doNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                      <span className="text-slate-600 text-sm">{o.customer.name}</span>
                      {o.salesOrder&&<span className="text-xs text-slate-400">← {o.salesOrder.orderNumber}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{o.customer.address||'No address'} · {o.customer.phone||''}</p>

                    {/* Stage pipeline visual */}
                    <div className="flex items-center gap-1 mb-3">
                      {STAGES.map((stage,i)=>{
                        const done = STAGES.indexOf(o.status) >= i;
                        return (
                          <div key={stage} className="flex items-center gap-1">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${done?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-400'}`}>
                              <i className={`bi ${STAGE_ICON[stage]} text-xs`}/><span className="capitalize">{stage}</span>
                            </div>
                            {i<STAGES.length-1&&<i className="bi bi-chevron-right text-slate-300 text-xs"/>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500"><i className="bi bi-person-fill mr-1"/>Driver:</span>
                      <input defaultValue={o.driver} onBlur={e=>handleAssign(o._id,e.target.value,o.vehicle)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-purple-400" placeholder="Driver name"/>
                      <span className="text-slate-500"><i className="bi bi-truck mr-1"/>Vehicle:</span>
                      <input defaultValue={o.vehicle} onBlur={e=>handleAssign(o._id,o.driver,e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-purple-400" placeholder="Plate / type"/>
                    </div>
                    {o.dispatchedAt&&<p className="text-xs text-slate-400 mt-1">Dispatched: {new Date(o.dispatchedAt).toLocaleString('en-GB')}</p>}
                    {o.deliveredAt&&<p className="text-xs text-emerald-600 mt-0.5">Delivered: {new Date(o.deliveredAt).toLocaleString('en-GB')}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <select value={o.status} onChange={e=>handleStatus(o._id,e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>deleteDeliveryOrder(o._id).then(load)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 flex items-center justify-center gap-1">
                      <i className="bi bi-trash"/>Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {showModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">New Delivery Order</h3>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg"/></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error&&<p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Sales Order *</label>
                <select value={form.salesOrder} onChange={e=>handleSOSelect(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select SO…</option>
                  {salesOrders.filter(o=>o.status!=='cancelled'&&o.status!=='delivered').map(o=><option key={o._id} value={o._id}>{o.orderNumber} — {o.customer.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
                  <input value={form.customer.name} onChange={e=>setForm(f=>({...f,customer:{...f.customer,name:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.customer.phone} onChange={e=>setForm(f=>({...f,customer:{...f.customer,phone:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Delivery Address</label>
                <input value={form.customer.address} onChange={e=>setForm(f=>({...f,customer:{...f.customer,address:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Driver</label>
                  <input value={form.driver} onChange={e=>setForm(f=>({...f,driver:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Vehicle</label>
                  <input value={form.vehicle} onChange={e=>setForm(f=>({...f,vehicle:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Create DO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
