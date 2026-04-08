import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOrderStats, listCustomerOrders } from '../api/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function StatCard({ icon, label, value, sub, color }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        red: 'from-red-500 to-red-600',
        amber: 'from-amber-500 to-amber-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color] || colors.blue} rounded-2xl p-5 text-white shadow-md`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-white/80">{label}</p>
                    <p className="text-4xl font-bold mt-1">{value}</p>
                    {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
                </div>
                <span className="p-3 bg-white/20 rounded-xl">
                    <i className={`bi ${icon} text-2xl`} />
                </span>
            </div>
        </div>
    );
}

export default function CustomerOrdersDashboard() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['order-stats'],
        queryFn: () => getOrderStats().then((r) => r.data),
    });

    const { data: ordersRes, isLoading: ordersLoading } = useQuery({
        queryKey: ['customer-orders'],
        queryFn: () => listCustomerOrders({ limit: 100 }).then((r) => r.data),
    });

    const delayedOrders = (ordersRes?.orders || []).filter(
        (o) => o.isDelayed && o.status !== 'delivered'
    );

    const chartData = stats?.monthlyStats || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Order Tracking Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Real-time overview of all customer orders</p>
                </div>
                <Link
                    to="/orders/new"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                    <i className="bi bi-plus-lg" /> New Order
                </Link>
            </div>

            {/* Stat cards */}
            {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="bi-cart-check" label="Active Orders" value={stats?.active ?? '—'} sub="In progress" color="blue" />
                    <StatCard icon="bi-check-circle" label="Completed" value={stats?.delivered ?? '—'} sub="Delivered" color="emerald" />
                    <StatCard icon="bi-exclamation-triangle" label="Delayed" value={stats?.delayed ?? '—'} sub="Past due date" color="red" />
                    <StatCard icon="bi-speedometer" label="On-Time Rate" value={`${stats?.onTimeRate ?? '—'}%`} sub={`${stats?.total ?? 0} total orders`} color="amber" />
                </div>
            )}

            {/* Delay Alerts */}
            {!ordersLoading && delayedOrders.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <i className="bi bi-alarm text-red-500 text-lg" />
                        <h2 className="font-semibold text-red-700">
                            {delayedOrders.length} Overdue Order{delayedOrders.length > 1 ? 's' : ''} Need Attention
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {delayedOrders.map((o) => {
                            const days = Math.abs(
                                Math.ceil((new Date(o.expectedDeliveryDate) - new Date()) / (1000 * 60 * 60 * 24))
                            );
                            return (
                                <Link
                                    key={o._id}
                                    to={`/orders/${o._id}`}
                                    className="flex items-center justify-between px-4 py-2.5 bg-white border border-red-100 rounded-xl hover:border-red-300 transition-colors group"
                                >
                                    <span className="font-medium text-slate-700 text-sm">
                                        #{o.orderNumber} — {o.customerName}
                                        <span className="ml-2 text-slate-400 font-normal">{o.productDescription}</span>
                                    </span>
                                    <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                                        {days} day{days !== 1 ? 's' : ''} overdue
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Monthly chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-700">Monthly Delivery Performance</h2>
                    <Link to="/orders/report" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Full Report <i className="bi bi-arrow-right" />
                    </Link>
                </div>
                {statsLoading ? (
                    <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
                ) : chartData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                        No data yet — create orders to see performance charts.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="delayed" name="Delayed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-700">Recent Orders</h2>
                    <Link to="/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500">
                            <th className="px-5 py-3 text-left font-medium">Order #</th>
                            <th className="px-5 py-3 text-left font-medium">Customer</th>
                            <th className="px-5 py-3 text-left font-medium">Product</th>
                            <th className="px-5 py-3 text-left font-medium">Due Date</th>
                            <th className="px-5 py-3 text-left font-medium">Status</th>
                            <th className="px-5 py-3 text-left font-medium">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordersLoading && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
                        )}
                        {!ordersLoading && (ordersRes?.orders || []).slice(0, 8).map((o) => (
                            <tr key={o._id} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${o.isDelayed ? 'bg-red-50/40' : ''}`}>
                                <td className="px-5 py-3">
                                    <Link to={`/orders/${o._id}`} className="text-blue-600 hover:underline font-medium">
                                        #{o.orderNumber}
                                    </Link>
                                </td>
                                <td className="px-5 py-3 text-slate-600">{o.customerName}</td>
                                <td className="px-5 py-3 text-slate-500 max-w-[180px] truncate">{o.productDescription}</td>
                                <td className={`px-5 py-3 text-sm ${o.isDelayed ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                    {new Date(o.expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {o.isDelayed && <i className="bi bi-exclamation-triangle-fill ml-1 text-red-400" />}
                                </td>
                                <td className="px-5 py-3">
                                    <OrderStatusChip status={o.status} isDelayed={o.isDelayed} />
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
                                            <div
                                                className="h-1.5 rounded-full bg-blue-500"
                                                style={{ width: `${o.completionPercentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 tabular-nums">{o.completionPercentage || 0}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!ordersLoading && (ordersRes?.orders || []).length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No orders yet. Create one!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OrderStatusChip({ status, isDelayed }) {
    const map = {
        confirmed: 'bg-slate-100 text-slate-600',
        in_production: 'bg-blue-100 text-blue-700',
        cutting: 'bg-orange-100 text-orange-700',
        washing: 'bg-cyan-100 text-cyan-700',
        qc: 'bg-purple-100 text-purple-700',
        packing: 'bg-indigo-100 text-indigo-700',
        delivered: 'bg-emerald-100 text-emerald-700',
    };
    const label = status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDelayed && status !== 'delivered' ? 'bg-red-100 text-red-700' : map[status] || 'bg-slate-100 text-slate-600'}`}>
            {isDelayed && status !== 'delivered' && <i className="bi bi-exclamation-circle" />}
            {isDelayed && status !== 'delivered' ? 'Delayed' : label}
        </span>
    );
}
