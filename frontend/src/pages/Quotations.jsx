import { useState, useEffect } from 'react';
import { getQuotations, createQuotation, updateQuotation, deleteQuotation, convertQuotation } from '../api/sales';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
};

const PRODUCTS = [
  "Men's Slim Fit Jeans",
  "Men's Regular Fit Jeans",
  "Women's Jeans",
  "Men's T-Shirt",
  "Women's T-Shirt",
  "Men's Polo Shirt",
  "Men's Jacket",
  "Women's Jacket",
  "Shorts",
  "Trousers",
];

const emptyForm = {
  customer: { name: '', email: '', phone: '', address: '' },
  items: [{ description: '', qty: 1, unitPrice: 0, totalPrice: 0 }],
  taxRate: 0, validUntil: '', notes: '', status: 'draft',
};

const printQuote = (q) => {
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>${q.quoteNumber}</title>
    <style>body{font-family:sans-serif;padding:32px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;}th{background:#f5f5f5;}.header{display:flex;justify-content:space-between;margin-bottom:24px;}</style>
    </head><body>
    <div class="header"><div><h2>QUOTATION</h2><p><strong>${q.quoteNumber}</strong></p></div><div style="text-align:right"><p><strong>To:</strong> ${q.customer.name}</p><p>${q.customer.email||''}</p><p>${q.customer.phone||''}</p></div></div>
    <p><strong>Valid Until:</strong> ${new Date(q.validUntil).toLocaleDateString('en-GB')} &nbsp; <strong>Status:</strong> ${q.status}</p>
    <table><thead><tr><th>#</th><th>Product Name</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
    ${q.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.description}</td><td>${it.qty}</td><td>Rs. ${it.unitPrice?.toLocaleString()}</td><td>Rs. ${it.totalPrice?.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>
    <div style="text-align:right;margin-top:16px"><p>Subtotal: Rs. ${q.subtotal?.toLocaleString()}</p><p>Tax (${q.taxRate}%): Rs. ${q.taxAmount?.toLocaleString()}</p><h3>Total: Rs. ${q.totalAmount?.toLocaleString()}</h3></div>
    ${q.notes?`<p><strong>Notes:</strong> ${q.notes}</p>`:''}
    </body></html>`);
  win.document.close(); win.print();
};

function daysLeft(date) {
  const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
  return diff;
}

export default function Quotations() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(null);

  const load = async () => { setLoading(true); try { setQuotes(await getQuotations()); } catch{} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const updateItem = (i, f, v) => setForm(frm => {
    const items = [...frm.items];
    items[i] = { ...items[i], [f]: v };
    if (f === 'qty' || f === 'unitPrice') items[i].totalPrice = Number(items[i].qty) * Number(items[i].unitPrice);
    return { ...frm, items };
  });

  const calcTotals = () => {
    const sub = form.items.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
    const tax = sub * (Number(form.taxRate) / 100);
    return { sub, tax, total: sub + tax };
  };

  const handleSave = async () => {
    if (!form.customer.name.trim()) { setError('Customer name required'); return; }
    if (!form.validUntil) { setError('Validity date required'); return; }
    setSaving(true);
    try {
      if (editing) await updateQuotation(editing, form);
      else await createQuotation(form);
      setShowModal(false); await load();
    } catch (e) { setError(e?.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleConvert = async (id) => {
    if (!window.confirm('Convert this quotation to a Sales Order?')) return;
    setConverting(id);
    try { await convertQuotation(id, {}); await load(); } catch{} finally { setConverting(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete quotation?')) return;
    try { await deleteQuotation(id); await load(); } catch{} };

  const { sub, tax, total } = calcTotals();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Quotations & Estimates</h1>
          <p className="text-slate-500 text-sm">Create price estimates and convert to Sales Orders</p></div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); }}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New Quotation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: quotes.length, color: 'text-purple-600 bg-purple-50', icon: 'bi-file-earmark-text' },
          { label: 'Pending', value: quotes.filter(q => q.status === 'sent').length, color: 'text-blue-600 bg-blue-50', icon: 'bi-clock' },
          { label: 'Approved', value: quotes.filter(q => q.status === 'approved').length, color: 'text-emerald-600 bg-emerald-50', icon: 'bi-check-circle-fill' },
          { label: 'Converted', value: quotes.filter(q => q.status === 'converted').length, color: 'text-orange-600 bg-orange-50', icon: 'bi-arrow-right-circle-fill' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}><i className={`bi ${c.icon} text-lg`} /></div>
            <div><p className="text-2xl font-bold text-slate-800">{c.value}</p><p className="text-xs text-slate-500">{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-400">Loading…</div>
          : quotes.length === 0 ? <div className="p-12 text-center text-slate-400"><i className="bi bi-file-earmark-text text-5xl block mb-3 opacity-20" />No quotations yet.</div>
          : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['Quote #', 'Customer', 'Total', 'Valid Until', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map(q => {
                  const days = daysLeft(q.validUntil);
                  const expired = days < 0;
                  return (
                    <tr key={q._id} className="hover:bg-slate-50 group">
                      <td className="px-4 py-3 font-bold text-purple-700">{q.quoteNumber}</td>
                      <td className="px-4 py-3"><p className="font-medium text-slate-800">{q.customer.name}</p><p className="text-xs text-slate-400">{q.customer.phone}</p></td>
                      <td className="px-4 py-3 font-semibold text-slate-800">Rs. {q.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 text-xs">{new Date(q.validUntil).toLocaleDateString('en-GB')}</p>
                        <p className={`text-xs font-medium ${expired ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {expired ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                        </p>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>{q.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => printQuote(q)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Print"><i className="bi bi-printer text-sm" /></button>
                          {q.status !== 'converted' && q.status !== 'rejected' && (
                            <button onClick={() => handleConvert(q._id)} disabled={converting === q._id}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Convert to SO">
                              {converting === q._id ? <i className="bi bi-arrow-repeat animate-spin text-sm" /> : <i className="bi bi-arrow-right-circle text-sm" />}
                            </button>
                          )}
                          <button onClick={() => { setEditing(q._id); setForm({ customer: q.customer, items: q.items, taxRate: q.taxRate, validUntil: q.validUntil?.slice(0,10), notes: q.notes||'', status: q.status }); setError(''); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><i className="bi bi-pencil text-sm" /></button>
                          <button onClick={() => handleDelete(q._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><i className="bi bi-trash text-sm" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b z-10">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit' : 'New'} Quotation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[['name','Customer Name *'],['email','Email'],['phone','Phone'],['address','Address']].map(([k,l]) => (
                  <div key={k} className={k==='address' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{l}</label>
                    <input value={form.customer[k]} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, [k]: e.target.value }}))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</p>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium px-1">
                <span className="col-span-5">Product Name</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-3">Unit Price (Rs.)</span>
                <span className="col-span-1"></span>
                <span className="col-span-1">Total</span>
              </div>

              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={it.description} onChange={e => updateItem(i,'description',e.target.value)}
                    className="col-span-5 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    <option value="">-- Select Product --</option>
                    {PRODUCTS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={it.qty} onChange={e => updateItem(i,'qty',e.target.value)}
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <input type="number" min="0" value={it.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)}
                    className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx!==i) }))}
                    className="col-span-1 text-slate-400 hover:text-red-500 flex justify-center text-sm"><i className="bi bi-trash" /></button>
                  <p className="col-span-1 text-xs text-slate-500 text-right">={Number(it.totalPrice).toLocaleString()}</p>
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description:'', qty:1, unitPrice:0, totalPrice:0 }] }))}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"><i className="bi bi-plus" />Add Item</button>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input type="number" min="0" max="100" value={form.taxRate} onChange={e => setForm(f => ({...f, taxRate: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Valid Until *</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({...f, validUntil: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {['draft','sent','approved','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-sm text-right space-y-1">
                <p className="text-slate-500">Subtotal: <strong className="text-slate-800">Rs. {sub.toLocaleString()}</strong></p>
                <p className="text-slate-500">Tax ({form.taxRate}%): <strong className="text-slate-800">Rs. {tax.toLocaleString()}</strong></p>
                <p className="text-purple-800 font-bold text-lg">Total: Rs. {total.toLocaleString()}</p>
              </div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" /></div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}{editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}