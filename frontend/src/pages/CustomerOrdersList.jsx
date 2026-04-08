import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listCustomerOrders, createCustomerOrder, deleteCustomerOrder } from '../api/client';

const ALL_STATUSES = [
    'confirmed', 'in_production', 'cutting', 'washing', 'qc', 'packing', 'delivered',
];

function statusColor(status, isDelayed) {
    if (isDelayed && status !== 'delivered') return 'bg-red-100 text-red-700 border-red-200';
    const m = {
        confirmed: 'bg-slate-100 text-slate-600 border-slate-200',
        in_production: 'bg-blue-100 text-blue-700 border-blue-200',
        cutting: 'bg-orange-100 text-orange-700 border-orange-200',
        washing: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        qc: 'bg-purple-100 text-purple-700 border-purple-200',
        packing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return m[status] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
    orderNumber: '', customerName: '', customerContact: '', productDescription: '',
    quantity: '', expectedDeliveryDate: '', notes: '',
};

export default function CustomerOrdersList() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErr, setFormErr] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-orders', filterStatus],
        queryFn: () => listCustomerOrders({ status: filterStatus || undefined, limit: 200 }).then((r) => r.data),
    });

    const createMut = useMutation({
        mutationFn: createCustomerOrder,
        onSuccess: () => {
            qc.invalidateQueries(['customer-orders']);
            qc.invalidateQueries(['order-stats']);
            setShowModal(false);
            setForm(EMPTY_FORM);
        },
        onError: (e) => setFormErr(e.response?.data?.error || e.message),
    });

    const deleteMut = useMutation({
        mutationFn: deleteCustomerOrder,
        onSuccess: () => {
            qc.invalidateQueries(['customer-orders']);
            qc.invalidateQueries(['order-stats']);
        },
    });

    const orders = (data?.orders || []).filter((o) =>
        !search ||
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        o.productDescription?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormErr('');
        if (!form.orderNumber || !form.customerName || !form.productDescription || !form.quantity || !form.expectedDeliveryDate) {
            setFormErr('Please fill in all required fields.');
            return;
        }
        createMut.mutate({ ...form, quantity: Number(form.quantity) });
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Customer Orders</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{data?.total ?? 0} orders total</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/orders/dashboard" className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm transition-colors">
                        <i className="bi bi-speedometer2" /> Dashboard
                    </Link>
                    <button
                        onClick={() => { setShowModal(true); setFormErr(''); setForm(EMPTY_FORM); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors"
                    >
                        <i className="bi bi-plus-lg" /> New Order
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order #, customer, product..."
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 bg-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
                >
                    <option value="">All Statuses</option>
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                </select>
                {(search || filterStatus) && (
                    <button onClick={() => { setSearch(''); setFilterStatus(''); }} className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm">
                        <i className="bi bi-x-circle mr-1" />Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {error && <p className="px-5 py-4 text-red-600 text-sm">{error.message}</p>}
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-left">
                            <th className="px-5 py-3 font-medium">Order #</th>
                            <th className="px-5 py-3 font-medium">Customer</th>
                            <th className="px-5 py-3 font-medium">Product</th>
                            <th className="px-5 py-3 font-medium">Qty</th>
                            <th className="px-5 py-3 font-medium">Expected Delivery</th>
                            <th className="px-5 py-3 font-medium">Completion</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Loading orders...</td></tr>
                        )}
                        {!isLoading && orders.map((o) => (
                            <tr
                                key={o._id}
                                className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${o.isDelayed && o.status !== 'delivered' ? 'bg-red-50/30' : ''}`}
                            >
                                <td className="px-5 py-3 font-medium">
                                    <Link to={`/orders/${o._id}`} className="text-blue-600 hover:underline">#{o.orderNumber}</Link>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="font-medium text-slate-700">{o.customerName}</div>
                                    {o.customerContact && <div className="text-xs text-slate-400">{o.customerContact}</div>}
                                </td>
                                <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{o.productDescription}</td>
                                <td className="px-5 py-3 text-slate-600 tabular-nums">{o.quantity?.toLocaleString()}</td>
                                <td className={`px-5 py-3 text-sm ${o.isDelayed && o.status !== 'delivered' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                    <div className="flex items-center gap-1">
                                        {fmtDate(o.expectedDeliveryDate)}
                                        {o.isDelayed && o.status !== 'delivered' && (
                                            <i className="bi bi-exclamation-triangle-fill text-red-400 text-xs" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
                                            <div
                                                className={`h-2 rounded-full ${o.completionPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                style={{ width: `${o.completionPercentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{o.completionPercentage || 0}%</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(o.status, o.isDelayed)}`}>
                                        {o.isDelayed && o.status !== 'delivered' && <i className="bi bi-exclamation-circle text-xs" />}
                                        {o.isDelayed && o.status !== 'delivered' ? 'Delayed' : o.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <Link to={`/orders/${o._id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                            <i className="bi bi-eye text-sm" />
                                        </Link>
                                        <button
                                            onClick={() => { if (window.confirm(`Delete order #${o.orderNumber}?`)) deleteMut.mutate(o._id); }}
                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <i className="bi bi-trash3 text-sm" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && orders.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-5 py-14 text-center">
                                    <i className="bi bi-inbox text-4xl text-slate-200 block mb-2" />
                                    <p className="text-slate-400">No orders found. Try adjusting filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800 text-lg">Create New Order</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {formErr && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{formErr}</p>}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Order Number *</label>
                                    <input value={form.orderNumber} onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. ORD-2025-001" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Quantity *</label>
                                    <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
                                <input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Customer / Company name" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Contact</label>
                                <input value={form.customerContact} onChange={(e) => setForm((f) => ({ ...f, customerContact: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone / email" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Product Description *</label>
                                <input value={form.productDescription} onChange={(e) => setForm((f) => ({ ...f, productDescription: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Men's Slim Fit Jeans – Style A23" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery Date *</label>
                                <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional notes..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
                                    {createMut.isPending ? 'Creating...' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
