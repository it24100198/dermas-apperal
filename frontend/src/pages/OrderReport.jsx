import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrderStats, listCustomerOrders } from '../api/client';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from 'recharts';

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderReport() {
    const [printMode, setPrintMode] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['order-stats'],
        queryFn: () => getOrderStats().then((r) => r.data),
    });

    const { data: ordersRes, isLoading: ordersLoading } = useQuery({
        queryKey: ['customer-orders-all'],
        queryFn: () => listCustomerOrders({ limit: 500 }).then((r) => r.data),
    });

    const allOrders = ordersRes?.orders || [];
    const delivered = allOrders.filter((o) => o.status === 'delivered');
    const onTime = delivered.filter((o) => new Date(o.deliveredDate) <= new Date(o.expectedDeliveryDate));
    const delayed = allOrders.filter((o) => o.isDelayed && o.status !== 'delivered');

    const onTimeRate = stats?.onTimeRate ?? (delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 0);

    const chartData = stats?.monthlyStats || [];

    const handleExportCsv = () => {
        const headers = ['Order #', 'Customer', 'Product', 'Qty', 'Confirmed', 'Expected Delivery', 'Status', 'Completion %', 'Delayed'];
        const rows = allOrders.map((o) => [
            o.orderNumber,
            o.customerName,
            o.productDescription,
            o.quantity,
            fmtDate(o.confirmedDate),
            fmtDate(o.expectedDeliveryDate),
            o.status,
            o.completionPercentage,
            o.isDelayed ? 'Yes' : 'No',
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Delivery Performance Report</h1>
                    <p className="text-slate-500 text-sm mt-0.5">On-time delivery analysis and order statistics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCsv}
                        disabled={ordersLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-40"
                    >
                        <i className="bi bi-download" /> Export CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors"
                    >
                        <i className="bi bi-printer" /> Print Report
                    </button>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Orders', value: stats?.total ?? allOrders.length, icon: 'bi-cart3', color: 'text-slate-700' },
                    { label: 'Delivered', value: stats?.delivered ?? delivered.length, icon: 'bi-check-circle', color: 'text-emerald-600' },
                    { label: 'Active', value: stats?.active ?? allOrders.filter((o) => o.status !== 'delivered').length, icon: 'bi-arrow-repeat', color: 'text-blue-600' },
                    { label: 'Delayed', value: stats?.delayed ?? delayed.length, icon: 'bi-exclamation-triangle', color: 'text-red-600' },
                    { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: 'bi-graph-up-arrow', color: onTimeRate >= 80 ? 'text-emerald-600' : onTimeRate >= 50 ? 'text-amber-600' : 'text-red-600' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                        <i className={`bi ${kpi.icon} text-2xl ${kpi.color}`} />
                        <p className={`text-2xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Combo chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-semibold text-slate-700 mb-4">Monthly Performance (Last 6 Months)</h2>
                {statsLoading ? (
                    <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
                ) : chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-300">
                        <div className="text-center">
                            <i className="bi bi-bar-chart text-5xl block mb-2" />
                            <p>No data yet</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <ComposedChart data={chartData} margin={{ top: 4, right: 10, bottom: 4, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar yAxisId="left" dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="left" dataKey="delayed" name="Delayed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey={(d) => d.total > 0 ? Math.round((d.delivered / d.total) * 100) : 0}
                                name="On-Time %"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Full orders table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-700 text-sm">All Orders Detail</h2>
                    <span className="text-xs text-slate-400">{allOrders.length} orders</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="px-4 py-2.5 text-left font-medium">Order #</th>
                                <th className="px-4 py-2.5 text-left font-medium">Customer</th>
                                <th className="px-4 py-2.5 text-left font-medium">Product</th>
                                <th className="px-4 py-2.5 text-left font-medium">Qty</th>
                                <th className="px-4 py-2.5 text-left font-medium">Confirmed</th>
                                <th className="px-4 py-2.5 text-left font-medium">Due Date</th>
                                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                                <th className="px-4 py-2.5 text-left font-medium">%</th>
                                <th className="px-4 py-2.5 text-left font-medium">Delay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading && (
                                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
                            )}
                            {!ordersLoading && allOrders.map((o) => (
                                <tr key={o._id} className={`border-t border-slate-100 ${o.isDelayed && o.status !== 'delivered' ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                                    <td className="px-4 py-2.5 font-medium text-slate-700">#{o.orderNumber}</td>
                                    <td className="px-4 py-2.5 text-slate-600">{o.customerName}</td>
                                    <td className="px-4 py-2.5 text-slate-500 max-w-[160px] truncate">{o.productDescription}</td>
                                    <td className="px-4 py-2.5 tabular-nums">{o.quantity?.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{fmtDate(o.confirmedDate)}</td>
                                    <td className={`px-4 py-2.5 text-xs ${o.isDelayed && o.status !== 'delivered' ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                                        {fmtDate(o.expectedDeliveryDate)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                o.isDelayed ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {o.isDelayed && o.status !== 'delivered' ? 'Delayed' : o.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{o.completionPercentage || 0}%</td>
                                    <td className="px-4 py-2.5">
                                        {o.isDelayed && o.status !== 'delivered' ? (
                                            <span className="text-red-500 text-xs font-medium">
                                                <i className="bi bi-exclamation-circle mr-1" />Late
                                            </span>
                                        ) : (
                                            <span className="text-emerald-500 text-xs">On track</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!ordersLoading && allOrders.length === 0 && (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No orders to report yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
