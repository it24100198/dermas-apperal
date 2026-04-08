import { useState, useEffect } from 'react';
import { getSalesReturns, createSalesReturn, approveReturn, rejectReturn, getSalesOrders } from '../api/sales';

const STATUS_COLORS = {
  pending:'bg-amber-100 text-amber-700', approved:'bg-blue-100 text-blue-700',
  rejected:'bg-red-100 text-red-700', completed:'bg-emerald-100 text-emerald-700',
};

const emptyForm = {
  salesOrder: '', customer: { name:'', phone:'' },
  items: [{ description:'', qty:1, reason:'', condition:'sellable', material:'' }],
  refundType: 'credit_note', notes: '',
};

export default function SalesReturns() {
  const [returns, setReturns] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionModal, setActionModal] = useState(null); // { rma, type }
  const [approver, setApprover] = useState('');

  const load = async () => {
    setLoading(true);
    try { const [ret, sos] = await Promise.all([getSalesReturns(), getSalesOrders()]); setReturns(ret); setSalesOrders(sos); }
    catch{} finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const handleSOSelect = (soId) => {
    const so = salesOrders.find(o=>o._id===soId);
    if(so) setForm(f=>({...f,salesOrder:soId,customer:{name:so.customer.name,phone:so.customer.phone||''}}));
    else setForm(f=>({...f,salesOrder:soId}));
  };

  const updateItem = (i,field,val) => setForm(f=>{
    const items=[...f.items]; items[i]={...items[i],[field]:val}; return {...f,items};
  });

  const handleSave = async () => {
    if(!form.salesOrder){setError('Select a Sales Order');return;}
    if(!form.customer.name.trim()){setError('Customer name required');return;}
    setSaving(true);
    try{await createSalesReturn(form);setShowModal(false);await load();}
    catch(e){setError(e?.response?.data?.error||'Failed');}
    finally{setSaving(false);}
  };

  const handleAction = async () => {
    if(!actionModal) return;
    setSaving(true);
    try {
      if(actionModal.type==='approve') await approveReturn(actionModal.rma._id,{approvedBy:approver});
      else await rejectReturn(actionModal.rma._id,{approvedBy:approver});
      setActionModal(null); await load();
    } catch{} finally{setSaving(false);}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Sales Returns (RMA)</h1>
          <p className="text-slate-500 text-sm">Process customer returns with approval workflow and auto-restock</p></div>
        <button onClick={()=>{setForm(emptyForm);setError('');setShowModal(true);}}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <i className="bi bi-plus-lg"/>New Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['pending','approved','rejected','completed'].map(s=>(
          <div key={s} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{returns.filter(r=>r.status===s).length}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s]}`}>{s}</span>
          </div>
        ))}
      </div>

      {loading?<div className="p-12 text-center text-slate-400">Loading…</div>
        :returns.length===0?<div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400"><i className="bi bi-arrow-return-left text-5xl block mb-3 opacity-20"/>No returns recorded yet.</div>
        :(
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['RMA #','Customer','Order','Items','Refund Type','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map(r=>(
                  <tr key={r._id} className="hover:bg-slate-50 group">
                    <td className="px-4 py-3 font-bold text-purple-700">{r.rmaNumber}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{r.customer.name}</p><p className="text-xs text-slate-400">{r.customer.phone}</p></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.salesOrder?.orderNumber||'—'}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {r.items.map((it,i)=>(
                          <div key={i} className="text-xs text-slate-600">
                            <span className="font-medium">{it.qty}x</span> {it.description}
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${it.condition==='sellable'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{it.condition}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{r.refundType.replace('_',' ')}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      {r.status==='pending'&&(
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>{setActionModal({rma:r,type:'approve'});setApprover('');}} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium">
                            <i className="bi bi-check-lg mr-1"/>Approve
                          </button>
                          <button onClick={()=>{setActionModal({rma:r,type:'reject'});setApprover('');}} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">
                            <i className="bi bi-x-lg mr-1"/>Reject
                          </button>
                        </div>
                      )}
                      {r.status==='completed'&&<span className="text-xs text-emerald-600"><i className="bi bi-arrow-down-circle-fill mr-1"/>Restocked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* New Return Modal */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10">
              <h3 className="font-semibold text-slate-800">New Return Request (RMA)</h3>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error&&<p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Sales Order *</label>
                <select value={form.salesOrder} onChange={e=>handleSOSelect(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select order…</option>
                  {salesOrders.map(o=><option key={o._id} value={o._id}>{o.orderNumber} — {o.customer.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input value={form.customer.name} onChange={e=>setForm(f=>({...f,customer:{...f.customer,name:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.customer.phone} onChange={e=>setForm(f=>({...f,customer:{...f.customer,phone:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Items</p>
              {form.items.map((it,i)=>(
                <div key={i} className="space-y-2 bg-slate-50 rounded-xl p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input value={it.description} onChange={e=>updateItem(i,'description',e.target.value)} placeholder="Item description" className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <input type="number" min="1" value={it.qty} onChange={e=>updateItem(i,'qty',e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={it.reason} onChange={e=>updateItem(i,'reason',e.target.value)} placeholder="Reason for return" className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <select value={it.condition} onChange={e=>updateItem(i,'condition',e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="sellable">Sellable</option><option value="damaged">Damaged</option>
                    </select>
                  </div>
                  {form.items.length>1&&<button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}))} className="text-xs text-red-500 hover:underline">Remove</button>}
                </div>
              ))}
              <button onClick={()=>setForm(f=>({...f,items:[...f.items,{description:'',qty:1,reason:'',condition:'sellable',material:''}]}))} className="text-xs text-purple-600 hover:underline flex items-center gap-1"><i className="bi bi-plus"/>Add Item</button>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Refund Type</label>
                <select value={form.refundType} onChange={e=>setForm(f=>({...f,refundType:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="credit_note">Credit Note</option><option value="replacement">Replacement</option><option value="refund">Cash Refund</option>
                </select></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"/></div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Action Modal */}
      {actionModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className={`px-6 py-4 rounded-t-2xl text-white ${actionModal.type==='approve'?'bg-emerald-600':'bg-red-600'}`}>
              <h3 className="font-semibold">{actionModal.type==='approve'?'✓ Approve':'✗ Reject'} RMA — {actionModal.rma.rmaNumber}</h3>
              {actionModal.type==='approve'&&<p className="text-xs opacity-80 mt-0.5">Sellable items will be automatically restocked</p>}
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">Approved/Rejected By *</label>
              <input value={approver} onChange={e=>setApprover(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Manager name"/>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setActionModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleAction} disabled={saving||!approver.trim()} className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 ${actionModal.type==='approve'?'bg-emerald-600 hover:bg-emerald-700':'bg-red-600 hover:bg-red-700'}`}>
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
