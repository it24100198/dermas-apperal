import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { getExpenseSummary, getExpenses, getReimbursements, getCategories } from '../api/expenses';
import { getPurchaseAnalytics } from '../api/purchase';
import { getSalesAnalytics } from '../api/sales';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_OPTIONS = [2026, 2025, 2024, 2023];
const PIE_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#ef4444', '#14b8a6', '#64748b'];

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Not available';
  return `${Number(value).toFixed(1)}%`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function StatCard({ title, value, note, icon, accent, status }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <i className={`bi ${icon} text-lg`} />
        </div>
      </div>
      {status && <div className="mt-4 text-xs font-medium text-slate-500">{status}</div>}
    </div>
  );
}

function InsightItem({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{value}</span>
    </div>
  );
}

function ProgressRow({ label, value, note, accent }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} />
      </div>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

export default function FinancialHealth() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['financial-health', year],
    queryFn: async () => {
      const results = await Promise.allSettled([
        getExpenseSummary(year),
        getExpenses({ year }),
        getReimbursements({ status: 'pending' }),
        getCategories(),
        getPurchaseAnalytics(year),
        getSalesAnalytics(year),
      ]);

      const pick = (index, fallback) => (results[index]?.status === 'fulfilled' ? results[index].value : fallback);

      return {
        expenseSummary: pick(0, null),
        expenses: safeArray(pick(1, [])),
        reimbursements: safeArray(pick(2, [])),
        categories: safeArray(pick(3, [])),
        purchaseAnalytics: pick(4, null),
        salesAnalytics: pick(5, null),
      };
    },
    staleTime: 30 * 1000,
  });

  const expenseSummaryMonthly = useMemo(() => {
    const rows = MONTHS.map((label, index) => ({
      label,
      month: index + 1,
      expenses: 0,
      rawMaterials: 0,
      sales: 0,
      profit: 0,
    }));

    safeArray(data?.expenseSummary?.monthly).forEach((entry) => {
      const monthIndex = (Number(entry.month) || 1) - 1;
      if (rows[monthIndex]) rows[monthIndex].expenses += Number(entry.total || 0);
    });

    safeArray(data?.purchaseAnalytics?.monthlySpend).forEach((entry) => {
      const monthIndex = (Number(entry._id) || 1) - 1;
      if (rows[monthIndex]) rows[monthIndex].rawMaterials += Number(entry.total || 0);
    });

    safeArray(data?.salesAnalytics?.monthlyRevenue).forEach((entry) => {
      const monthIndex = (Number(entry._id) || 1) - 1;
      if (rows[monthIndex]) rows[monthIndex].sales += Number(entry.revenue || 0);
    });

    rows.forEach((row) => {
      row.profit = row.sales - row.rawMaterials - row.expenses;
    });

    return rows;
  }, [data]);

  const filteredExpenses = useMemo(() => {
    return safeArray(data?.expenses).filter((expense) => {
      const expenseDate = expense.date ? new Date(expense.date) : null;
      const matchesMonth = !month || (expenseDate && expenseDate.getMonth() + 1 === Number(month));
      const matchesCategory = !category || String(expense.category?._id || '') === String(category);
      return matchesMonth && matchesCategory;
    });
  }, [data, month, category]);

  const currentMonthIndex = new Date().getMonth();
  const previousMonthIndex = Math.max(0, currentMonthIndex - 1);
  const currentMonthData = expenseSummaryMonthly[currentMonthIndex] || { expenses: 0, rawMaterials: 0, sales: 0, profit: 0 };
  const previousMonthData = expenseSummaryMonthly[previousMonthIndex] || { expenses: 0, rawMaterials: 0, sales: 0, profit: 0 };

  const totalSales = Number(data?.salesAnalytics?.totalRevenue || 0);
  const rawMaterialCosts = Number(safeArray(data?.purchaseAnalytics?.monthlySpend).reduce((sum, row) => sum + Number(row.total || 0), 0));
  const operationalExpenses = Number(data?.expenseSummary?.yearTotal || 0);
  const netProfit = totalSales - rawMaterialCosts - operationalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : null;
  const expenseToSalesRatio = totalSales > 0 ? (operationalExpenses / totalSales) * 100 : null;
  const rawMaterialRatio = totalSales > 0 ? (rawMaterialCosts / totalSales) * 100 : null;
  const profitStatus = netProfit >= 0 ? 'Profit' : 'Loss';

  const expenseCategoryBreakdown = useMemo(() => {
    const source = filteredExpenses.length > 0 ? filteredExpenses : safeArray(data?.expenses);
    const totals = new Map();
    source.forEach((expense) => {
      const key = expense.category?.name || 'Uncategorized';
      totals.set(key, (totals.get(key) || 0) + Number(expense.amount || 0));
    });

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }));
  }, [filteredExpenses, data]);

  const topExpenseContributor = useMemo(() => {
    if (expenseCategoryBreakdown.length === 0) return 'No expense data';
    const top = expenseCategoryBreakdown[0];
    return `${top.name} (${formatCurrency(top.value)})`;
  }, [expenseCategoryBreakdown]);

  const selectedExpenseTrend = useMemo(() => {
    if (month) {
      const monthIndex = Number(month) - 1;
      const row = expenseSummaryMonthly[monthIndex];
      return row ? `${MONTHS[monthIndex]} total: ${formatCurrency(row.expenses)}` : 'No monthly trend available';
    }

    const delta = currentMonthData.expenses - previousMonthData.expenses;
    if (delta === 0) return 'Expenses are flat versus the previous month.';
    return delta > 0
      ? `Expenses are up by ${formatCurrency(delta)} versus last month.`
      : `Expenses are down by ${formatCurrency(Math.abs(delta))} versus last month.`;
  }, [month, expenseSummaryMonthly, currentMonthData, previousMonthData]);

  const categoryOptions = useMemo(() => safeArray(data?.categories).sort((a, b) => a.name.localeCompare(b.name)), [data]);

  const chartHasData = expenseSummaryMonthly.some((row) => row.sales > 0 || row.rawMaterials > 0 || row.expenses > 0);

  const recentExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.slice(0, 8);
  }, [filteredExpenses]);

  const pendingClaims = safeArray(data?.reimbursements);
  const pendingClaimsTotal = pendingClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const expenseShare = totalSales > 0 ? (operationalExpenses / totalSales) * 100 : null;

  const downloadCsv = () => {
    const rows = [
      ['Date', 'Category', 'Amount', 'Payment Method', 'Vendor', 'Description'],
      ...filteredExpenses.map((expense) => [
        expense.date ? new Date(expense.date).toLocaleDateString('en-GB') : '',
        expense.category?.name || 'Uncategorized',
        Number(expense.amount || 0),
        String(expense.paymentMethod || '').replace(/_/g, ' '),
        expense.vendorName || '',
        expense.description || '',
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-health-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const actions = [
    { label: 'Add Expense', icon: 'bi-plus-lg', onClick: () => navigate('/expenses'), primary: true },
    { label: 'Export Report', icon: 'bi-download', onClick: downloadCsv },
    { label: 'Download PDF', icon: 'bi-file-earmark-pdf', onClick: () => window.print() },
  ];

  const sidebarLabel = month ? MONTHS[Number(month) - 1] : 'All months';

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Financial Health Dashboard</h1>
            <p className="text-sm text-slate-600">Track sales, costs, expenses, and net profit in one dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${action.primary ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <i className={`bi ${action.icon}`} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <FilterSelect label="Year" value={year} onChange={(value) => setYear(Number(value))} options={YEAR_OPTIONS.map((option) => ({ value: option, label: option }))} />
            <FilterSelect label="Month" value={month} onChange={setMonth} options={[{ value: '', label: 'All months' }, ...MONTHS.map((label, index) => ({ value: String(index + 1), label }))]} />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: '', label: 'All categories' }, ...categoryOptions.map((option) => ({ value: option._id, label: option.name }))]} />
          </div>
          <div className="text-xs text-slate-500">Viewing: {sidebarLabel} · {year}</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={isLoading ? '—' : totalSales > 0 ? formatCurrency(totalSales) : 'No sales recorded yet'}
          note="Revenue recognized for the selected year"
          icon="bi-cart-check-fill"
          accent="from-sky-500 to-cyan-500"
          status={totalSales > 0 ? `Sales available for ${year}` : 'No sales data for this period'}
        />
        <StatCard
          title="Raw Material Costs"
          value={isLoading ? '—' : formatCurrency(rawMaterialCosts)}
          note="Direct material spend linked to production"
          icon="bi-boxes"
          accent="from-amber-500 to-orange-500"
          status={rawMaterialCosts > 0 ? `Material cost ratio: ${formatPercent(rawMaterialRatio)}` : 'No material spend recorded'}
        />
        <StatCard
          title="Operational Expenses"
          value={isLoading ? '—' : formatCurrency(operationalExpenses)}
          note={`${safeArray(data?.expenses).length} expense records tracked`}
          icon="bi-receipt"
          accent="from-rose-500 to-pink-500"
          status={expenseShare !== null ? `Expense-to-sales ratio: ${formatPercent(expenseShare)}` : 'No sales data to compare against'}
        />
        <StatCard
          title="Net Profit"
          value={isLoading ? '—' : formatCurrency(netProfit)}
          note={profitStatus === 'Profit' ? 'Positive result after direct and operating costs' : 'Current costs exceed sales'}
          icon={netProfit >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}
          accent={netProfit >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'}
          status={`${profitStatus}${profitMargin !== null ? ` · Margin ${formatPercent(profitMargin)}` : ' · Margin not available'}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Financial Overview</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Sales, costs, expenses, and profit snapshot</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{year}</span>
          </div>
          <div className="mt-4 h-[320px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-slate-400">Loading financial overview...</div>
            ) : !chartHasData ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
                <i className="bi bi-graph-up text-3xl opacity-30" />
                <p className="mt-3 text-sm font-medium text-slate-500">No financial activity yet</p>
                <p className="mt-1 text-xs text-slate-400">Add sales, expenses, or purchase records to populate this chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expenseSummaryMonthly} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="rawFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 28px rgba(15,23,42,0.08)' }} formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#0284c7" strokeWidth={2} fill="url(#salesFill)" />
                  <Area type="monotone" dataKey="rawMaterials" name="Raw Materials" stroke="#f59e0b" strokeWidth={2} fill="url(#rawFill)" />
                  <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseFill)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} fill="url(#profitFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ProgressRow
              label="Profit status"
              value={netProfit >= 0 ? 100 : 28}
              note={netProfit >= 0 ? 'Profit is positive for the selected year.' : 'Loss detected. Review sales and cost structure.'}
              accent={netProfit >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'}
            />
            <ProgressRow
              label="Net margin"
              value={profitMargin !== null ? Math.max(0, Math.min(100, profitMargin)) : 0}
              note={profitMargin !== null ? formatPercent(profitMargin) : 'Not available'}
              accent="from-sky-500 to-cyan-500"
            />
            <ProgressRow
              label="Expense to sales"
              value={expenseShare !== null ? Math.max(0, Math.min(100, expenseShare)) : 0}
              note={expenseShare !== null ? formatPercent(expenseShare) : 'No sales data'}
              accent="from-rose-500 to-pink-500"
            />
            <ProgressRow
              label="Raw material ratio"
              value={rawMaterialRatio !== null ? Math.max(0, Math.min(100, rawMaterialRatio)) : 0}
              note={rawMaterialRatio !== null ? formatPercent(rawMaterialRatio) : 'No sales data'}
              accent="from-amber-500 to-orange-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Key Insights</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Actionable financial signals</h3>
            <div className="mt-4 space-y-3">
              <InsightItem label="Profit status" value={profitStatus} tone={netProfit >= 0 ? 'teal' : 'red'} />
              <InsightItem label="Highest expense contributor" value={topExpenseContributor} tone="amber" />
              <InsightItem label="Sales data" value={totalSales > 0 ? 'Available' : 'No sales data'} tone={totalSales > 0 ? 'teal' : 'red'} />
              <InsightItem label="Expense trend" value={selectedExpenseTrend} tone="blue" />
              <InsightItem label="Claims awaiting review" value={`${pendingClaims.length} · ${formatCurrency(pendingClaimsTotal)}`} tone="amber" />
              <InsightItem label="Profit warning" value={netProfit < 0 ? 'Negative profit detected' : 'No profit warning'} tone={netProfit < 0 ? 'red' : 'teal'} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expense mix</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Category breakdown</h3>
            <div className="mt-4 h-[220px]">
              {expenseCategoryBreakdown.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  No expense categories found for the selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseCategoryBreakdown} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={3}>
                      {expenseCategoryBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {expenseCategoryBreakdown.slice(0, 4).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent expense activity</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Latest expense transactions</h3>
            </div>
            <button type="button" onClick={() => navigate('/expenses')} className="text-sm font-medium text-slate-700 hover:text-slate-900">
              View all
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {isLoading ? (
              <div className="p-10 text-center text-slate-400">Loading recent expenses...</div>
            ) : recentExpenses.length === 0 ? (
              <div className="p-10 text-center text-slate-400">No expenses found for the selected filters.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Payment</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {expense.date ? new Date(expense.date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{expense.category?.name || 'Uncategorized'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{String(expense.paymentMethod || '—').replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {expense.isRecurring ? 'Recurring' : 'Recorded'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monthly trend</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Expense movement and sales context</h3>
          <div className="mt-4 h-[280px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-slate-400">Loading trend chart...</div>
            ) : !chartHasData ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                No monthly data to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseSummaryMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="expenses" name="Operating Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rawMaterials" name="Raw Materials" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="sales" name="Sales" fill="#0284c7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <InsightItem label="Selected filters" value={`${year} · ${month ? MONTHS[Number(month) - 1] : 'All months'} · ${category ? 'Category filtered' : 'All categories'}`} />
            <InsightItem label="Trend note" value={selectedExpenseTrend} tone="blue" />
            <InsightItem label="Sales availability" value={totalSales > 0 ? 'Sales data exists' : 'No sales data'} tone={totalSales > 0 ? 'teal' : 'red'} />
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}