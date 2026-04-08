import { useEffect, useMemo, useState } from 'react';
import {
  getPurchaseOrdersList,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getSuppliers,
  getMaterials,
  getRequisitions,
  getGRNs,
} from '../api/purchase';
import { downloadCsv } from '../utils/csvExport';

const STATUS_ORDER = ['draft', 'sent', 'shipped', 'received', 'cancelled'];
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

const emptyForm = {
  supplier: '',
  requisition: '',
  expectedDeliveryDate: '',
  notes: '',
  items: [{ material: '', description: '', qty: 1, unitPrice: 0, totalPrice: 0 }],
};

const PAGE_SIZE = 8;

const derivePaymentStatus = (po, grnByPoId) => {
  const entries = grnByPoId[po._id] || [];
  if (!entries.length) return 'unpaid';
  const allPaid = entries.every((g) => g.paymentStatus === 'paid');
  if (allPaid) return 'paid';
  const anyPaid = entries.some((g) => g.paymentStatus === 'paid' || g.paymentStatus === 'partial');
  return anyPaid ? 'partial' : 'unpaid';
};

export default function PurchaseOrders() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvedReqs, setApprovedReqs] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [detailOrder, setDetailOrder] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = { page: nextPage, pageSize: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;
      if (supplierFilter !== 'all') params.supplierId = supplierFilter;

      const [o, s, m, reqs, grn] = await Promise.all([
        getPurchaseOrdersList(params),
        getSuppliers(),
        getMaterials(),
        getRequisitions({ status: 'approved' }),
        getGRNs(),
      ]);
      setRows(o.items || []);
      setTotal(o.total || 0);
      setTotalPages(o.totalPages || 1);
      setPage(o.page || nextPage);
      setSuppliers(s);
      setMaterials(m);
      setApprovedReqs(reqs.filter((r) => !r.linkedPO));
      setGrnList(grn);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to load purchase orders.' });
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
  }, [search, statusFilter, paymentFilter, supplierFilter]);

  useEffect(() => {
    load(page);
  }, [page, search, statusFilter, paymentFilter, supplierFilter]);

  const grnByPoId = useMemo(() => {
    return grnList.reduce((acc, g) => {
      const id = g.purchaseOrder?._id;
      if (!id) return acc;
      if (!acc[id]) acc[id] = [];
      acc[id].push(g);
      return acc;
    }, {});
  }, [grnList]);

  const updateItem = (index, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };

      if (field === 'material') {
        const mat = materials.find((m) => m._id === value);
        if (mat) {
          items[index].description = mat.name;
          items[index].unitPrice = Number(mat.unitPrice || 0);
        }
      }

      if (field === 'qty' || field === 'unitPrice' || field === 'material') {
        items[index].totalPrice = Number(items[index].qty || 0) * Number(items[index].unitPrice || 0);
      }

      return { ...f, items };
    });
  };

  const applyRequisition = (requisitionId) => {
    const req = approvedReqs.find((r) => r._id === requisitionId);
    if (!req) return;

    const supplierId = req.linkedPO?.supplier || '';
    const mappedItems = req.items.map((item) => {
      const material = item.material;
      const unitPrice = Number(material?.unitPrice || 0);
      return {
        material: material?._id || '',
        description: material?.name || '',
        qty: Number(item.qty || 1),
        unitPrice,
        totalPrice: Number(item.qty || 1) * unitPrice,
      };
    });

    setForm((f) => ({
      ...f,
      requisition: req._id,
      supplier: supplierId || f.supplier,
      notes: `Based on requisition ${req._id.slice(-6).toUpperCase()}`,
      items: mappedItems.length ? mappedItems : f.items,
    }));
  };

  const handleSave = async () => {
    if (!form.supplier) {
      setFormError('Select a supplier.');
      return;
    }

    if (form.items.some((item) => !item.description.trim() || Number(item.qty) <= 0)) {
      setFormError('Each item needs description and quantity greater than 0.');
      return;
    }

    setSaving(true);
    try {
      await createPurchaseOrder({
        supplier: form.supplier,
        requisition: form.requisition || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes.trim(),
        items: form.items.map((item) => ({
          material: item.material || undefined,
          description: item.description.trim(),
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.qty) * Number(item.unitPrice),
        })),
      });
      setShowModal(false);
      setForm(emptyForm);
      setFormError('');
      setFeedback({ type: 'success', message: 'Purchase order created successfully.' });
      await load(page);
    } catch (e) {
      setFormError(e?.response?.data?.error || 'Failed to create purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updatePurchaseOrder(id, { status });
      setFeedback({ type: 'success', message: `PO status changed to ${status}.` });
      await load(page);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to update PO status.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await deletePurchaseOrder(id);
      setFeedback({ type: 'success', message: 'Purchase order deleted.' });
      await load(page);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to delete purchase order.' });
    }
  };

  const exportCsv = () => {
    downloadCsv({
      fileName: 'purchase-orders-export.csv',
      columns: [
        { header: 'PO Number', accessor: (po) => po.poNumber },
        { header: 'Supplier', accessor: (po) => po.supplier?.name || '-' },
        { header: 'Date', accessor: (po) => new Date(po.createdAt).toLocaleDateString('en-GB') },
        { header: 'Delivery Date', accessor: (po) => (po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB') : '-') },
        { header: 'Total Amount', accessor: (po) => po.totalAmount || 0 },
        { header: 'Payment Status', accessor: (po) => derivePaymentStatus(po, grnByPoId) },
        { header: 'PO Status', accessor: (po) => po.status },
      ],
      rows,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="text-slate-500 text-sm">Manage purchase orders from draft to receipt and payment completion</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(emptyForm); setFormError(''); }} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <i className="bi bi-plus-lg" /> New PO
        </button>
      </div>

      {feedback.message && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="opacity-70 hover:opacity-100"><i className="bi bi-x-lg" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-end">
            <button onClick={exportCsv} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <i className="bi bi-download" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by PO number, supplier or notes" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">PO Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All</option>
                {STATUS_ORDER.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment Status</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All suppliers</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="bi bi-receipt text-5xl block mb-3 opacity-20" />
            <p className="mb-3">No purchase orders found for current filters.</p>
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create Purchase Order</button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  {['PO Number', 'Supplier', 'Date', 'Delivery Date', 'Total Amount', 'Payment Status', 'PO Status', 'Created By', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((po) => {
                  const paymentStatus = derivePaymentStatus(po, grnByPoId);
                  return (
                    <tr key={po._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{po.poNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{po.supplier?.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(po.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-slate-600">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">Rs. {Number(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[paymentStatus]}`}>{paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <select value={po.status} onChange={(e) => handleStatusChange(po._id, e.target.value)} className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[po.status]}`}>
                          {STATUS_ORDER.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{po.requisition ? 'From requisition' : 'Manual'}</td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => setDetailOrder(po)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg" title="View Details"><i className="bi bi-eye text-sm" /></button><button onClick={() => handleDelete(po._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete PO"><i className="bi bi-trash text-sm" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <p className="text-slate-500">Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} purchase orders</p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Previous</button>
                <span className="text-slate-600">Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 z-10">
              <h3 className="font-semibold text-slate-800">New Purchase Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                  <select value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select supplier...</option>
                    {suppliers.filter((s) => s.isActive).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Linked Requisition</label>
                  <select value={form.requisition} onChange={(e) => { const value = e.target.value; setForm((f) => ({ ...f, requisition: value })); if (value) applyRequisition(value); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">None</option>
                    {approvedReqs.map((r) => <option key={r._id} value={r._id}>{`REQ-${r._id.slice(-6).toUpperCase()} | ${r.requestedBy}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                  <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Order Items *</label>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { material: '', description: '', qty: 1, unitPrice: 0, totalPrice: 0 }] }))} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><i className="bi bi-plus" /> Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="md:col-span-3"><label className="block text-xs font-medium text-slate-500 mb-1">Material</label><select value={item.material} onChange={(e) => updateItem(index, 'material', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Select material...</option>{materials.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select></div>
                      <div className="md:col-span-3"><label className="block text-xs font-medium text-slate-500 mb-1">Description</label><input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Qty</label><input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Unit Price</label><input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                      <div className="md:col-span-1 text-sm font-semibold text-slate-700">Rs. {Number(item.totalPrice || 0).toLocaleString()}</div>
                      <div className="md:col-span-1 flex justify-end"><button type="button" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== index) }))} disabled={form.items.length === 1} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><i className="bi bi-trash" /></button></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right text-sm font-semibold text-slate-700">Total Amount: Rs. {form.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Delivery terms, packing instructions, or remarks" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">{saving && <i className="bi bi-arrow-repeat animate-spin" />}Create PO</button>
            </div>
          </div>
        </div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailOrder(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">PO Details</h3>
              <button onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">PO Number:</span> <span className="font-medium text-slate-800">{detailOrder.poNumber}</span></p>
              <p><span className="text-slate-500">Supplier:</span> <span className="text-slate-700">{detailOrder.supplier?.name || '-'}</span></p>
              <p><span className="text-slate-500">Status:</span> <span className="text-slate-700 capitalize">{detailOrder.status}</span></p>
              <p><span className="text-slate-500">Delivery Date:</span> <span className="text-slate-700">{detailOrder.expectedDeliveryDate ? new Date(detailOrder.expectedDeliveryDate).toLocaleDateString('en-GB') : '-'}</span></p>
              <p><span className="text-slate-500">Total:</span> <span className="text-slate-700">Rs. {Number(detailOrder.totalAmount || 0).toLocaleString()}</span></p>
              <div>
                <p className="text-slate-500 mb-1">Items</p>
                <ul className="space-y-1">{(detailOrder.items || []).map((item, idx) => <li key={idx} className="text-slate-700 text-xs bg-slate-50 rounded-lg px-2 py-1">{item.description} x {item.qty} - Rs. {Number(item.totalPrice || 0).toLocaleString()}</li>)}</ul>
              </div>
              <p><span className="text-slate-500">Notes:</span> <span className="text-slate-700">{detailOrder.notes || '-'}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
