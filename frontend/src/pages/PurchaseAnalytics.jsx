import { useState, useEffect } from 'react';
import { getPurchaseAnalytics } from '../api/purchase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

export default function PurchaseAnalytics() {
  const year = new Date().getFullYear();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseAnalytics(year).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const monthlyData = MONTHS.map((name, i) => {
    const m = data?.monthlySpend?.find(r => r._id === i + 1);
    return { name, spend: m?.total || 0, paid: m?.paid || 0 };
  });

  const pieData = (data?.bySupplier || []).map((s, i) => ({
    name: s.supplierName || 'Unknown', value: s.total, fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const totalSpend = data?.monthlySpend?.reduce((s, m) => s + m.total, 0) || 0;
  const totalPaid  = data?.monthlySpend?.reduce((s, m) => s + m.paid, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Purchase Analytics</h1>
        <p className="text-slate-500 text-sm">Spend analysis, supplier performance and outstanding payments for {year}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: formatLKR(totalSpend), icon: 'bi-cash-stack', color: 'from-indigo-500 to-indigo-700' },
          { label: 'Total Paid', value: formatLKR(totalPaid), icon: 'bi-check2-circle', color: 'from-emerald-500 to-emerald-700' },
          { label: 'Outstanding', value: formatLKR(data?.totalOutstanding || 0), icon: 'bi-exclamation-circle-fill', color: 'from-rose-500 to-rose-700' },
          { label: 'Active POs', value: data?.activePOs ?? '—', icon: 'bi-receipt', color: 'from-amber-500 to-amber-700' },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} text-white rounded-xl p-5 shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{c.label}</span>
              <i className={`bi ${c.icon} text-2xl opacity-80`} />
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Spend Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Monthly Spend vs Paid ({year})</h2>
          {loading ? <div className="h-64 flex items-center justify-center text-slate-400">Loading…</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={v => [formatLKR(v)]} />
                <Legend />
                <Bar dataKey="spend" name="Total Spend" fill="#6366f1" radius={2} />
                <Bar dataKey="paid" name="Amount Paid" fill="#10b981" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Spend by Supplier Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Spend by Supplier</h2>
          {loading ? <div className="h-64 flex items-center justify-center text-slate-400">Loading…</div>
            : pieData.length === 0 ? <div className="h-64 flex items-center justify-center text-slate-300 text-sm">No data</div> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={v => [formatLKR(v)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-slate-600 truncate max-w-[110px]">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-700">{formatLKR(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>
      </div>

      {/* Outstanding Payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <i className="bi bi-exclamation-circle-fill text-rose-500" />
          <h2 className="font-semibold text-slate-700">Outstanding Payments</h2>
          {!loading && data?.outstanding?.length > 0 && (
            <span className="ml-auto text-sm font-bold text-rose-600">{formatLKR(data.totalOutstanding)}</span>
          )}
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading…</div>
          : !data?.outstanding?.length ? (
            <div className="p-8 text-center text-slate-400"><i className="bi bi-check-circle-fill text-emerald-400 text-2xl block mb-2" />All payments up to date!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>{['GRN', 'Supplier', 'Invoice Amt', 'Paid', 'Outstanding', 'Status', 'Received'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.outstanding.map(g => {
                  const outstanding = (g.invoiceAmount || 0) - (g.amountPaid || 0);
                  return (
                    <tr key={g._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{g.grnNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{g.purchaseOrder?.supplier?.name || '—'}</td>
                      <td className="px-4 py-3">{formatLKR(g.invoiceAmount || 0)}</td>
                      <td className="px-4 py-3 text-emerald-700">{formatLKR(g.amountPaid || 0)}</td>
                      <td className="px-4 py-3 font-bold text-rose-600">{formatLKR(outstanding)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(g.receivedDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
