import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenseSummary, getExpenses, getReimbursements } from '../api/expenses';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Mock Sales & Raw Material data (replace with real API when available)
const MOCK_SALES   = 4850000;
const MOCK_RAW_MAT = 1820000;

const CATEGORY_COLORS = {
  rent: '#6366f1', electricity: '#f59e0b', salaries: '#10b981',
  maintenance: '#ef4444', internet: '#3b82f6', transport: '#ec4899', other: '#8b5cf6',
};

function formatLKR(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [summary, setSummary]     = useState(null);
  const [recent, setRecent]       = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getExpenseSummary(year),
      getExpenses({ year }),
      getReimbursements({ status: 'pending' }),
    ])
      .then(([s, exp, claims]) => {
        setSummary(s);
        setRecent(exp.slice(0, 8));
        setPendingClaims(claims);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  // Build monthly chart data
  const chartData = MONTH_NAMES.map((name, idx) => {
    const month = idx + 1;
    const row = { name, total: 0 };
    if (summary) {
      summary.monthly.filter(m => m.month === month).forEach(m => {
        row[m.categoryType] = (row[m.categoryType] || 0) + m.total;
        row.total += m.total;
      });
    }
    return row;
  });

  const totalOpEx     = summary?.yearTotal || 0;
  const netProfit     = MOCK_SALES - (MOCK_RAW_MAT + totalOpEx);
  const profitPercent = MOCK_SALES > 0 ? ((netProfit / MOCK_SALES) * 100).toFixed(1) : 0;

  const kpiCards = [
    { label: 'Total Sales',          value: formatLKR(MOCK_SALES),   color: 'from-blue-500 to-blue-700',    icon: 'bi-cart-check-fill' },
    { label: 'Raw Material Costs',   value: formatLKR(MOCK_RAW_MAT), color: 'from-amber-500 to-amber-700',  icon: 'bi-boxes' },
    { label: 'Operational Expenses', value: formatLKR(totalOpEx),    color: 'from-rose-500 to-rose-700',    icon: 'bi-receipt' },
    { label: 'Net Profit',           value: formatLKR(netProfit),    color: netProfit >= 0 ? 'from-emerald-500 to-emerald-700' : 'from-red-600 to-red-800', icon: 'bi-graph-up-arrow', sub: `${profitPercent}% margin` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Health Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Profit & Loss overview for {year}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/expenses')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <i className="bi bi-plus-lg" /> Add Expense
          </button>
          <button onClick={() => navigate('/expenses/reimbursements')}
            className="relative px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
            <i className="bi bi-person-check" /> Claims
            {pendingClaims.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingClaims.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} text-white rounded-xl p-5 shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{k.label}</span>
              <i className={`bi ${k.icon} text-2xl opacity-80`} />
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : k.value}</p>
            {k.sub && <p className="text-xs mt-1 opacity-80">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Net Profit Formula Banner */}
      <div className="bg-slate-800 text-white rounded-xl p-4 flex items-center gap-4 text-sm">
        <i className="bi bi-calculator-fill text-2xl text-indigo-400 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Net Profit = Total Sales − (Raw Material Costs + Operational Expenses)</span>
          {!loading && (
            <span className="ml-4 font-bold text-emerald-400">
              = {formatLKR(MOCK_SALES)} − ({formatLKR(MOCK_RAW_MAT)} + {formatLKR(totalOpEx)})
              = <span className={netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}>{formatLKR(netProfit)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Pending Reimbursement Alert */}
      {pendingClaims.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <i className="bi bi-exclamation-triangle-fill text-amber-500 text-xl" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">{pendingClaims.length} reimbursement claim{pendingClaims.length > 1 ? 's' : ''} awaiting approval</p>
            <p className="text-amber-700 text-sm">Total: {formatLKR(pendingClaims.reduce((s,c)=>s+c.amount,0))}</p>
          </div>
          <button onClick={() => navigate('/expenses/reimbursements')}
            className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors">
            Review
          </button>
        </div>
      )}

      {/* Monthly Expenses Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Monthly Expenses by Category ({year})</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">Loading chart…</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(value) => [formatLKR(value)]} />
              <Legend />
              {Object.entries(CATEGORY_COLORS).map(([type, color]) => (
                <Bar key={type} dataKey={type} stackId="a" fill={color} name={type.charAt(0).toUpperCase() + type.slice(1)} radius={2} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Recent Expenses</h2>
          <button onClick={() => navigate('/expenses')} className="text-sm text-indigo-600 hover:underline">
            View All
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No expenses recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                {['Date','Category','Vendor','Method','Amount'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{e.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{e.vendorName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                      e.paymentMethod === 'bank_transfer' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {e.paymentMethod?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    {e.isPettyCash && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Petty Cash</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatLKR(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
