import { useState, useEffect } from 'react';
import { getInvoices, createInvoice, recordPayment, createCreditNote, getAgingReport, getSalesOrders } from '../api/sales';

const PAY_COLORS = { unpaid:'bg-red-100 text-red-700', partial:'bg-amber-100 text-amber-700', paid:'bg-emerald-100 text-emerald-700' };
const fmt = (n) => 'Rs. ' + Number(n||0).toLocaleString();

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [aging, setAging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices'); // 'invoices' | 'aging'
  const [payModal, setPayModal] = useState(null);
  const [cnModal, setCnModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ salesOrder:'', customer:{name:'',email:'',phone:'',address:''}, items:[{description:'',qty:1,unitPrice:0,totalPrice:0}], taxRate:0, invoiceType:'tax', dueDate:'', notes:'' });
  const [payForm, setPayForm] = useState({ amount:'', method:'bank_transfer', note:'' });
  const [cnReason, setCnReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [invs, sos, age] = await Promise.all([getInvoices(), getSalesOrders(), getAgingReport()]);
      setInvoices(invs); setSalesOrders(sos); setAging(age);
    } catch{} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSOSelect = (soId) => {
    const so = salesOrders.find(o => o._id === soId);
    if (so) setForm(f => ({ ...f, salesOrder: soId, customer: so.customer, items: so.items.map(i => ({description:i.description,qty:i.qty,unitPrice:i.unitPrice,totalPrice:i.totalPrice})), taxRate: so.taxRate }));
    else setForm(f => ({ ...f, salesOrder: soId }));
  };

  const updateItem = (i, field, val) => setForm(frm => {
    const items = [...frm.items]; items[i] = {...items[i],[field]:val};
    if(field==='qty'||field==='unitPrice') items[i].totalPrice = Number(items[i].qty)*Number(items[i].unitPrice);
    return {...frm,items};
  });

  const handleSave = async () => {
    if(!form.customer.name.trim()){setError('Customer name required');return;}
    setSaving(true);
    try { await createInvoice(form); setShowModal(false); await load(); }
    catch(e){setError(e?.response?.data?.error||'Failed');}
    finally{setSaving(false);}
  };

  const handlePayment = async () => {
    if(!payModal||!payForm.amount){return;}
    setSaving(true);
    try { await recordPayment(payModal._id, payForm); setPayModal(null); await load(); }
    catch{} finally{setSaving(false);}
  };

  const handleCreditNote = async () => {
    if(!cnModal) return;
    setSaving(true);
    try { await createCreditNote(cnModal._id, { reason: cnReason }); setCnModal(null); await load(); }
    catch{} finally{setSaving(false);}
  };

  const printInvoice = (inv) => {
    const win=window.open('','_blank');
    win.document.write(`<html><head><title>${inv.invoiceNumber}</title><style>body{font-family:sans-serif;padding:32px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;}th{background:#f5f5f5;}.header{display:flex;justify-content:space-between;margin-bottom:24px;}</style></head><body>
    <div class="header"><div><h2>${inv.isCreditNote?'CREDIT NOTE':'TAX INVOICE'}</h2><p><strong>${inv.invoiceNumber}</strong></p></div><div style="text-align:right"><p><strong>To:</strong> ${inv.customer.name}</p><p>${inv.customer.address||''}</p></div></div>
    <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
    ${inv.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.description}</td><td>${it.qty}</td><td>Rs. ${it.unitPrice?.toLocaleString()}</td><td>Rs. ${it.totalPrice?.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>
    <div style="text-align:right;margin-top:16px"><p>Subtotal: Rs. ${inv.subtotal?.toLocaleString()}</p><p>VAT/Tax (${inv.taxRate}%): Rs. ${inv.taxAmount?.toLocaleString()}</p><h3>Total: Rs. ${inv.totalAmount?.toLocaleString()}</h3><p>Paid: Rs. ${inv.amountPaid?.toLocaleString()}</p><p><strong>Outstanding: Rs. ${((inv.totalAmount||0)-(inv.amountPaid||0)).toLocaleString()}</strong></p></div>
    </body></html>`);
    win.document.close(); win.print();
  };

  const totalUnpaid = invoices.filter(i=>!i.isCreditNote&&i.paymentStatus!=='paid').reduce((s,i)=>s+((i.totalAmount||0)-(i.amountPaid||0)),0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Invoices & Billing</h1>
          <p className="text-slate-500 text-sm">Tax invoices, payment tracking, credit notes and aging reports</p></div>
        <button onClick={()=>{setForm({salesOrder:'',customer:{name:'',email:'',phone:'',address:''},items:[{description:'',qty:1,unitPrice:0,totalPrice:0}],taxRate:0,invoiceType:'tax',dueDate:'',notes:''});setError('');setShowModal(true);}}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <i className="bi bi-plus-lg"/>New Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total Invoiced',value:fmt(invoices.reduce((s,i)=>s+(i.totalAmount||0),0)),icon:'bi-receipt',color:'text-purple-600 bg-purple-50'},
          {label:'Total Collected',value:fmt(invoices.reduce((s,i)=>s+(i.amountPaid||0),0)),icon:'bi-check2-circle',color:'text-emerald-600 bg-emerald-50'},
          {label:'Outstanding',value:fmt(totalUnpaid),icon:'bi-exclamation-circle-fill',color:'text-rose-600 bg-rose-50'},
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}><i className={`bi ${c.icon} text-xl`}/></div>
            <div><p className="text-xl font-bold text-slate-800">{loading?'…':c.value}</p><p className="text-xs text-slate-500">{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['invoices','aging report'].map(t=>(
          <button key={t} onClick={()=>setTab(t==='aging report'?'aging':t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${(tab==='aging'?'aging report':tab)===t?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab==='invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading?<div className="p-8 text-center text-slate-400">Loading…</div>:invoices.length===0?<div className="p-12 text-center text-slate-400"><i className="bi bi-receipt text-5xl block mb-3 opacity-20"/>No invoices yet.</div>:(
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Invoice #','Customer','Type','Total','Paid','Status','Due','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv=>(
                  <tr key={inv._id} className="hover:bg-slate-50 group">
                    <td className="px-4 py-3 font-bold text-purple-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{inv.customer.name}</p><p className="text-xs text-slate-400">{inv.customer.email}</p></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.invoiceType==='tax'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600'}`}>{inv.invoiceType}</span></td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{fmt(inv.amountPaid)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLORS[inv.paymentStatus]}`}>{inv.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.dueDate?new Date(inv.dueDate).toLocaleDateString('en-GB'):'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>printInvoice(inv)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Print"><i className="bi bi-printer text-sm"/></button>
                        {inv.paymentStatus!=='paid'&&<button onClick={()=>{setPayModal(inv);setPayForm({amount:'',method:'bank_transfer',note:''});}} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Record Payment"><i className="bi bi-cash text-sm"/></button>}
                        {!inv.isCreditNote&&<button onClick={()=>{setCnModal(inv);setCnReason('');}} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Credit Note"><i className="bi bi-arrow-return-left text-sm"/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==='aging' && aging && (
        <div className="space-y-4">
          {[
            {key:'current',label:'Current (not overdue)',color:'bg-emerald-50 border-emerald-200 text-emerald-800'},
            {key:'days30',label:'1-30 Days Overdue',color:'bg-amber-50 border-amber-200 text-amber-800'},
            {key:'days60',label:'31-60 Days Overdue',color:'bg-orange-50 border-orange-200 text-orange-800'},
            {key:'over60',label:'60+ Days Overdue',color:'bg-red-50 border-red-200 text-red-800'},
          ].map(bucket=>(
            <div key={bucket.key} className={`rounded-xl border p-4 ${bucket.color}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{bucket.label} ({aging[bucket.key]?.length||0})</h3>
                <span className="font-bold">{fmt(aging[bucket.key]?.reduce((s,i)=>s+((i.totalAmount||0)-(i.amountPaid||0)),0)||0)}</span>
              </div>
              {aging[bucket.key]?.length>0&&(
                <div className="space-y-2">
                  {aging[bucket.key].map(inv=>(
                    <div key={inv._id} className="bg-white/70 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
                      <div><span className="font-bold">{inv.invoiceNumber}</span> — {inv.customer.name}</div>
                      <span className="font-semibold">{fmt((inv.totalAmount||0)-(inv.amountPaid||0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Invoice Modal */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10">
              <h3 className="font-semibold text-slate-800">New Tax Invoice</h3>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error&&<p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Link to Sales Order (optional)</label>
                  <select value={form.salesOrder} onChange={e=>handleSOSelect(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">None</option>
                    {salesOrders.map(o=><option key={o._id} value={o._id}>{o.orderNumber} — {o.customer.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Invoice Type</label>
                  <select value={form.invoiceType} onChange={e=>setForm(f=>({...f,invoiceType:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="tax">Tax Invoice</option><option value="proforma">Pro Forma</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['name','Customer Name *'],['email','Email'],['phone','Phone'],['address','Address']].map(([k,l])=>(
                  <div key={k} className={k==='address'?'col-span-2':''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{l}</label>
                    <input value={form.customer[k]} onChange={e=>setForm(f=>({...f,customer:{...f.customer,[k]:e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                ))}
              </div>
              {form.items.map((it,i)=>(
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={it.description} onChange={e=>updateItem(i,'description',e.target.value)} placeholder="Description" className="col-span-5 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  <input type="number" min="1" value={it.qty} onChange={e=>updateItem(i,'qty',e.target.value)} className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  <input type="number" min="0" value={it.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  <p className="col-span-1 text-xs text-slate-500">{Number(it.totalPrice).toLocaleString()}</p>
                  <button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}))} className="col-span-1 text-slate-400 hover:text-red-500 text-sm flex justify-center"><i className="bi bi-trash"/></button>
                </div>
              ))}
              <button onClick={()=>setForm(f=>({...f,items:[...f.items,{description:'',qty:1,unitPrice:0,totalPrice:0}]}))} className="text-xs text-purple-600 hover:underline flex items-center gap-1"><i className="bi bi-plus"/>Add Item</button>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input type="number" min="0" value={form.taxRate} onChange={e=>setForm(f=>({...f,taxRate:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/></div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 bg-emerald-600 rounded-t-2xl text-white"><h3 className="font-semibold">Record Payment — {payModal.invoiceNumber}</h3>
              <p className="text-xs opacity-80">Outstanding: {fmt((payModal.totalAmount||0)-(payModal.amountPaid||0))}</p></div>
            <div className="px-6 py-5 space-y-3">
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Amount (Rs.) *</label>
                <input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                <select value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {['cash','cheque','bank_transfer','card'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Note</label>
                <input value={payForm.note} onChange={e=>setPayForm(f=>({...f,note:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 50% advance"/></div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setPayModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handlePayment} disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {cnModal&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 bg-amber-600 rounded-t-2xl text-white"><h3 className="font-semibold">Issue Credit Note — {cnModal.invoiceNumber}</h3></div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Credit Note</label>
              <textarea value={cnReason} onChange={e=>setCnReason(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" placeholder="e.g. Goods returned, over-billing correction…"/>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={()=>setCnModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleCreditNote} disabled={saving} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 flex items-center gap-2">
                {saving&&<i className="bi bi-arrow-repeat animate-spin"/>}Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
