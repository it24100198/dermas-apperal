import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getCustomerOrder, updateOrderStatus, updateOrderDeliveryDate } from '../api/client';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import DelayAlertBanner from '../components/DelayAlertBanner';

const ALL_STATUSES = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_production', label: 'In Production' },
    { key: 'cutting', label: 'Cutting' },
    { key: 'washing', label: 'Washing' },
    { key: 'qc', label: 'QC / Final Check' },
    { key: 'packing', label: 'Packing' },
    { key: 'delivered', label: 'Delivered' },
];

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CompletionRing({ pct }) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="100" height="100" className="-rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <span className="absolute text-lg font-bold text-slate-700">{pct}%</span>
        </div>
    );
}

export default function CustomerOrderDetail() {
    const { orderId } = useParams();
    const qc = useQueryClient();

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');

    const [showDateEdit, setShowDateEdit] = useState(false);
    const [newDate, setNewDate] = useState('');

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['customer-order', orderId],
        queryFn: () => getCustomerOrder(orderId).then((r) => r.data),
    });

    const statusMut = useMutation({
        mutationFn: ({ status, note }) => updateOrderStatus(orderId, { status, note }),
        onSuccess: () => {
            qc.invalidateQueries(['customer-order', orderId]);
            qc.invalidateQueries(['customer-orders']);
            qc.invalidateQueries(['order-stats']);
            setShowStatusModal(false);
            setNewStatus('');
            setStatusNote('');
        },
    });

    const dateMut = useMutation({
        mutationFn: (date) => updateOrderDeliveryDate(orderId, { expectedDeliveryDate: date }),
        onSuccess: () => {
            qc.invalidateQueries(['customer-order', orderId]);
            qc.invalidateQueries(['customer-orders']);
            setShowDateEdit(false);
        },
    });

    if (isLoading) return <div className="text-slate-400 text-center py-20">Loading order...</div>;
    if (error) return <div className="text-red-600 py-10 text-center">{error.message}</div>;
    if (!order) return null;

    const due = new Date(order.expectedDeliveryDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const isOverdue = order.status !== 'delivered' && due < now;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-400">
                <Link to="/orders" className="hover:text-slate-600 transition-colors">Customer Orders</Link>
                <i className="bi bi-chevron-right text-xs" />
                <span className="text-slate-600 font-medium">#{order.orderNumber}</span>
            </nav>

            {/* Delay banner */}
            <DelayAlertBanner expectedDeliveryDate={order.expectedDeliveryDate} status={order.status} />

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800">Order #{order.orderNumber}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${isOverdue ? 'bg-red-100 text-red-700 border-red-200' :
                                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                {isOverdue ? 'DELAYED' : order.status?.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">{order.productDescription}</p>
                    </div>
                    <button
                        onClick={() => { setNewStatus(order.status); setShowStatusModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors"
                    >
                        <i className="bi bi-arrow-repeat" /> Update Status
                    </button>
                </div>

                {/* Info grid */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Customer</p>
                        <p className="font-semibold text-slate-700 mt-1">{order.customerName}</p>
                        {order.customerContact && <p className="text-xs text-slate-400">{order.customerContact}</p>}
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Quantity</p>
                        <p className="font-semibold text-slate-700 mt-1">{order.quantity?.toLocaleString()} units</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Confirmed On</p>
                        <p className="font-semibold text-slate-700 mt-1">{fmtDate(order.confirmedDate)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Expected Delivery</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                {fmtDate(order.expectedDeliveryDate)}
                            </p>
                            <button onClick={() => { setNewDate(order.expectedDeliveryDate?.split('T')[0]); setShowDateEdit(true); }}
                                className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors" title="Edit delivery date">
                                <i className="bi bi-pencil text-xs" />
                            </button>
                        </div>
                        {isOverdue && (
                            <p className="text-xs text-red-500 mt-0.5">{Math.abs(diffDays)} days overdue</p>
                        )}
                        {!isOverdue && order.status !== 'delivered' && (
                            <p className="text-xs text-slate-400 mt-0.5">{diffDays} day{diffDays !== 1 ? 's' : ''} remaining</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress + Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Completion ring */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-600 text-center">Completion</h3>
                    <CompletionRing pct={order.completionPercentage || 0} />
                    <p className="text-xs text-slate-400 text-center">
                        {order.status === 'delivered' ? 'Order delivered ✓' : `Current stage: ${order.status?.replace(/_/g, ' ')}`}
                    </p>
                </div>

                {/* Timeline */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-600 mb-5">Order Lifecycle</h3>
                    <OrderStatusTimeline statusHistory={order.statusHistory || []} currentStatus={order.status} />
                </div>
            </div>

            {/* Status history table */}
            {order.statusHistory?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700 text-sm">Activity Log</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                                <th className="px-5 py-2.5 text-left font-medium">Note</th>
                                <th className="px-5 py-2.5 text-left font-medium">Date & Time</th>
                                <th className="px-5 py-2.5 text-left font-medium">By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...order.statusHistory].reverse().map((h, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                    <td className="px-5 py-3">
                                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                            {h.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 italic text-xs max-w-[300px]">{h.note || '—'}</td>
                                    <td className="px-5 py-3 text-slate-400 text-xs tabular-nums">
                                        {h.timestamp ? new Date(h.timestamp).toLocaleString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                        }) : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-400 text-xs">{h.updatedBy?.name || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notes */}
            {order.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-slate-700 text-sm">{order.notes}</p>
                </div>
            )}

            {/* Update Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">Update Order Status</h2>
                            <button onClick={() => setShowStatusModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">New Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALL_STATUSES.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => setNewStatus(s.key)}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-colors ${newStatus === s.key
                                                    ? 'bg-slate-800 text-white border-slate-800'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                                }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Add a note for this update..."
                                />
                            </div>
                            {statusMut.isError && <p className="text-red-600 text-xs">{statusMut.error?.message}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => setShowStatusModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => newStatus && statusMut.mutate({ status: newStatus, note: statusNote })}
                                    disabled={!newStatus || statusMut.isPending}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                >
                                    {statusMut.isPending ? 'Saving...' : 'Save Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Delivery Date Modal */}
            {showDateEdit && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">Update Delivery Date</h2>
                            <button onClick={() => setShowDateEdit(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDateEdit(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => newDate && dateMut.mutate(newDate)}
                                    disabled={!newDate || dateMut.isPending}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                >
                                    {dateMut.isPending ? 'Saving...' : 'Update Date'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
