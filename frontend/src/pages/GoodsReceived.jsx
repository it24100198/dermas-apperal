import { useEffect, useState } from 'react';
import { getGRNsList, createGRN, recordGRNPayment, getPurchaseOrders } from '../api/purchase';
import { downloadCsv } from '../utils/csvExport';

const QC_COLORS = {
  pass: 'text-emerald-600',
  fail: 'text-red-600',
  pending: 'text-amber-600',
  partial: 'text-amber-600',
};

const PAY_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

const PAGE_SIZE = 8;

const stockUpdatedLabel = (grn) => (grn.items?.some((item) => item.qcStatus === 'pass') ? 'Yes' : 'No');

export default function GoodsReceived() {
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState(null);

  const [selectedPO, setSelectedPO] = useState('');
  const [form, setForm] = useState({ receivedBy: '', notes: '', items: [] });
  const [payForm, setPayForm] = useState({ invoiceNumber: '', invoiceAmount: '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [detailGrn, setDetailGrn] = useState(null);

  const [tab, setTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [qcFilter, setQcFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState({ all: 0, unpaid: 0, partial: 0, paid: 0 });

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = { page: nextPage, pageSize: PAGE_SIZE };
      if (tab !== 'all') params.paymentStatus = tab;
      if (qcFilter !== 'all') params.qcStatus = qcFilter;
      if (search.trim()) params.search = search.trim();

      const [g, o, cAll, cUnpaid, cPartial, cPaid] = await Promise.all([
        getGRNsList(params),
        getPurchaseOrders({ status: 'shipped' }),
        getGRNsList({ page: 1, pageSize: 1 }),
        getGRNsList({ paymentStatus: 'unpaid', page: 1, pageSize: 1 }),
        getGRNsList({ paymentStatus: 'partial', page: 1, pageSize: 1 }),
        getGRNsList({ paymentStatus: 'paid', page: 1, pageSize: 1 }),
      ]);
      setRows(g.items || []);
      setTotal(g.total || 0);
      setTotalPages(g.totalPages || 1);
      setPage(g.page || nextPage);
      setOrders(o);
      setTabCounts({
        all: cAll.total || 0,
        unpaid: cUnpaid.total || 0,
        partial: cPartial.total || 0,
        paid: cPaid.total || 0,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Unable to load goods received data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, qcFilter]);

  useEffect(() => {
    load(page);
  }, [page, tab, search, qcFilter]);

  const handlePOSelect = (poId) => {
    setSelectedPO(poId);
    const po = orders.find((order) => order._id === poId);
    if (po) {
      setForm((f) => ({
        ...f,
        items: po.items.map((item) => ({
          material: item.material?._id || null,
          description: item.description,
          orderedQty: Number(item.qty),
          receivedQty: Number(item.qty),
          qcStatus: 'pending',
          qcNote: '',
        })),
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSave = async () => {
    if (!selectedPO) {
      setFormError('Select a purchase order.');
      return;
    }
    if (!form.receivedBy.trim()) {
      setFormError('Received by is required.');
      return;
    }
    if (form.items.some((item) => Number(item.receivedQty) < 0)) {
      setFormError('Received quantity cannot be negative.');
      return;
    }

    const allQcDone = form.items.every((item) => item.qcStatus !== 'pending');
    const overallQcStatus = allQcDone
      ? form.items.every((item) => item.qcStatus === 'pass')
        ? 'pass'
        : form.items.some((item) => item.qcStatus === 'pass')
        ? 'partial'
        : 'fail'
      : 'pending';

    setSaving(true);
    try {
      await createGRN({
        ...form,
        purchaseOrder: selectedPO,
        receivedBy: form.receivedBy.trim(),
        notes: form.notes.trim(),
        items: form.items.map((item) => ({ ...item, receivedQty: Number(item.receivedQty), orderedQty: Number(item.orderedQty), qcNote: item.qcNote?.trim() || '' })),
        receivedDate: new Date(),
        overallQcStatus,
      });

      setShowModal(false);
      setSelectedPO('');
      setForm({ receivedBy: '', notes: '', items: [] });
      setFormError('');
      setFeedback({ type: 'success', message: 'GRN created and stock updated.' });
      await load(page);
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Failed to create GRN.');
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!payModal) return;
    if (!payForm.amountPaid || Number(payForm.amountPaid) <= 0) {
      setFormError('Enter a valid payment amount.');
      return;
    }

    setSaving(true);
    try {
      await recordGRNPayment(payModal._id, {
        ...payForm,
        invoiceAmount: Number(payForm.invoiceAmount || 0),
        amountPaid: Number(payForm.amountPaid),
      });
      setPayModal(null);
      setPayForm({ invoiceNumber: '', invoiceAmount: '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' });
      setFormError('');
      setFeedback({ type: 'success', message: 'Payment recorded successfully.' });
      await load(page);
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    downloadCsv({
      fileName: 'grn-export.csv',
      columns: [
        { header: 'GRN Number', accessor: (g) => g.grnNumber },
        { header: 'PO Number', accessor: (g) => g.purchaseOrder?.poNumber || '-' },
        { header: 'Supplier', accessor: (g) => g.purchaseOrder?.supplier?.name || '-' },
        { header: 'Received Date', accessor: (g) => new Date(g.receivedDate).toLocaleDateString('en-GB') },
        { header: 'Received By', accessor: (g) => g.receivedBy },
        { header: 'QC Status', accessor: (g) => g.overallQcStatus },
        { header: 'Payment Status', accessor: (g) => g.paymentStatus },
        { header: 'Stock Updated', accessor: (g) => stockUpdatedLabel(g) },
      ],
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Goods Received Notes</h1>
          <p className="text-slate-500 text-sm">Receive PO items, record QC, and track payment progress</p>
        </div>
        <button onClick={() => { setForm({ receivedBy: '', notes: '', items: [] }); setSelectedPO(''); setFormError(''); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New GRN
        </button>
      </div>

      {feedback.message && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="opacity-70 hover:opacity-100"><i className="bi bi-x-lg" /></button>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {['all', 'unpaid', 'partial', 'paid'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} ({tabCounts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4 flex justify-end">
            <button onClick={exportCsv} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <i className="bi bi-download" /> Export CSV
            </button>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by GRN, PO, supplier, or receiver" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">QC Status</label>
            <select value={qcFilter} onChange={(e) => setQcFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="partial">Partial</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><i className="bi bi-inbox text-5xl block mb-3 opacity-20" /><p className="mb-3">No GRNs found for current filters.</p><button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create GRN</button></div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider"><tr>{['GRN Number', 'PO Number', 'Supplier', 'Received Date', 'Received By', 'QC Status', 'Payment Status', 'Stock Updated', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{g.grnNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{g.purchaseOrder?.poNumber || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{g.purchaseOrder?.supplier?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(g.receivedDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-slate-600">{g.receivedBy}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${QC_COLORS[g.overallQcStatus]}`}>{g.overallQcStatus}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLORS[g.paymentStatus]}`}>{g.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-slate-600">{stockUpdatedLabel(g)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => setDetailGrn(g)} className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-100">View</button>{g.paymentStatus !== 'paid' ? (<button onClick={() => { setPayModal(g); setPayForm({ invoiceNumber: g.invoiceNumber || '', invoiceAmount: g.invoiceAmount || '', amountPaid: '', paymentMethod: 'bank_transfer', paymentNote: '' }); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Record Payment</button>) : (<span className="text-xs text-slate-400 self-center">No action</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <p className="text-slate-500">Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} GRNs</p>
              <div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Previous</button><span className="text-slate-600">Page {page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Next</button></div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10"><h3 className="font-semibold text-slate-800">New Goods Received Note</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button></div>
            <div className="px-6 py-5 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Purchase Order (Shipped) *</label><select value={selectedPO} onChange={(e) => handlePOSelect(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Select shipped PO...</option>{orders.map((o) => <option key={o._id} value={o._id}>{o.poNumber} - {o.supplier?.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Received By *</label><input value={form.receivedBy} onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              {form.items.length > 0 && (
                <div className="space-y-3"><p className="text-sm font-medium text-slate-700">Item QC Check</p>{form.items.map((item, index) => (<div key={index} className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100"><p className="font-medium text-slate-700 text-sm">{item.description}<span className="text-slate-400 font-normal ml-1">(ordered: {item.orderedQty})</span></p><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div><label className="block text-xs text-slate-500 mb-1">Received Qty</label><input type="number" min="0" value={item.receivedQty} onChange={(e) => updateItem(index, 'receivedQty', Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div><div><label className="block text-xs text-slate-500 mb-1">QC Result</label><select value={item.qcStatus} onChange={(e) => updateItem(index, 'qcStatus', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="pending">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option></select></div><div><label className="block text-xs text-slate-500 mb-1">QC Note</label><input value={item.qcNote} onChange={(e) => updateItem(index, 'qcNote', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" /></div></div></div>))}</div>
              )}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">{saving && <i className="bi bi-arrow-repeat animate-spin" />}Save GRN</button></div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-semibold text-slate-800">Record Payment - {payModal.grnNumber}</h3><button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button></div>
            <div className="px-6 py-5 space-y-3">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-slate-700 mb-1">Invoice Number</label><input value={payForm.invoiceNumber} onChange={(e) => setPayForm((f) => ({ ...f, invoiceNumber: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div><div><label className="block text-xs font-medium text-slate-700 mb-1">Invoice Amount (Rs.)</label><input type="number" value={payForm.invoiceAmount} onChange={(e) => setPayForm((f) => ({ ...f, invoiceAmount: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Amount Paid Now (Rs.) *</label><input type="number" value={payForm.amountPaid} onChange={(e) => setPayForm((f) => ({ ...f, amountPaid: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label><select value={payForm.paymentMethod} onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="bank_transfer">Bank Transfer</option></select></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Payment Note</label><input value={payForm.paymentNote} onChange={(e) => setPayForm((f) => ({ ...f, paymentNote: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setPayModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={handlePayment} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">{saving && <i className="bi bi-arrow-repeat animate-spin" />}Record Payment</button></div>
          </div>
        </div>
      )}

      {detailGrn && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailGrn(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">GRN Details</h3><button onClick={() => setDetailGrn(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button></div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">GRN Number:</span> <span className="font-medium text-slate-800">{detailGrn.grnNumber}</span></p>
              <p><span className="text-slate-500">PO Number:</span> <span className="text-slate-700">{detailGrn.purchaseOrder?.poNumber || '-'}</span></p>
              <p><span className="text-slate-500">Supplier:</span> <span className="text-slate-700">{detailGrn.purchaseOrder?.supplier?.name || '-'}</span></p>
              <p><span className="text-slate-500">Received:</span> <span className="text-slate-700">{new Date(detailGrn.receivedDate).toLocaleDateString('en-GB')} by {detailGrn.receivedBy}</span></p>
              <p><span className="text-slate-500">QC Status:</span> <span className="text-slate-700 capitalize">{detailGrn.overallQcStatus}</span></p>
              <p><span className="text-slate-500">Payment Status:</span> <span className="text-slate-700 capitalize">{detailGrn.paymentStatus}</span></p>
              <div><p className="text-slate-500 mb-1">Items</p><ul className="space-y-1">{(detailGrn.items || []).map((item, idx) => <li key={idx} className="text-slate-700 text-xs bg-slate-50 rounded-lg px-2 py-1">{item.description} ordered {item.orderedQty}, received {item.receivedQty} ({item.qcStatus})</li>)}</ul></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
