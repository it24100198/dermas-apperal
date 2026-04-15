import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExpenseSummary, getExpenses, getReimbursements } from '../api/expenses';
import { getStockOverview } from '../api/stock';
import { getPurchaseAnalytics } from '../api/purchase';
import { getSalesAnalytics } from '../api/sales';
import { getOrderStats, listCustomerOrders, getSupervisorDashboard } from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MODULES = [
  { label: 'Overview', description: 'Unified system snapshot and live performance summary.', icon: 'bi-speedometer2', to: '/', tone: 'from-sky-500 to-cyan-500' },
  { label: 'People', description: 'Employees, supervisors, and team directory controls.', icon: 'bi-people-fill', to: '/employees', tone: 'from-indigo-500 to-blue-500' },
  { label: 'Expense & Employee', description: 'Expenses, reimbursements, and workforce costs.', icon: 'bi-cash-coin', to: '/expenses', tone: 'from-rose-500 to-pink-500' },
  { label: 'Purchase Management', description: 'Suppliers, requisitions, orders, and GRN flow.', icon: 'bi-bag-check-fill', to: '/purchase/orders', tone: 'from-amber-500 to-orange-500' },
  { label: 'Manufacturing', description: 'Jobs, line progress, QC, and workflow execution.', icon: 'bi-gear-wide-connected', to: '/manufacturing/overview', tone: 'from-violet-500 to-fuchsia-500' },
  { label: 'Stock Control', description: 'Inventory, adjustments, issuance, and stock health.', icon: 'bi-boxes', to: '/stock/inventory', tone: 'from-teal-500 to-emerald-500' },
  { label: 'Sales & POS', description: 'Quotations, invoices, dispatch, and revenue analytics.', icon: 'bi-cart-check', to: '/sales/orders', tone: 'from-blue-500 to-sky-500' },
  { label: 'Order Tracking', description: 'Customer order status, delays, and delivery visibility.', icon: 'bi-truck', to: '/orders/dashboard', tone: 'from-cyan-500 to-slate-500' },
];

const EXPENSE_COLORS = ['#0f172a', '#0f766e', '#2563eb', '#7c3aed', '#f97316', '#db2777', '#6b7280'];
const SUPPLIER_COLORS = ['#0f766e', '#0284c7', '#7c3aed', '#f59e0b', '#ef4444', '#64748b'];

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function capitalizeLabel(value) {
  return String(value || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DashboardMetric({ icon, label, value, note, accent }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-900">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-slate-200`}>
          <i className={`bi ${icon} text-xl`} />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module }) {
  return (
    <Link
      to={module.to}
      className="group rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_28px_65px_rgba(15,23,42,0.13)]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.tone} text-white shadow-lg shadow-slate-200`}>
          <i className={`bi ${module.icon} text-xl`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{module.label}</h3>
          <p className="text-sm leading-6 text-slate-500">{module.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Open module</span>
          <i className="bi bi-arrow-up-right transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}

function ProgressRow({ label, value, note, accent, icon }) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <i className={`bi ${icon} text-slate-400`} />
          <span className="font-medium">{label}</span>
        </div>
        <span className="font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${clampPercent(value)}%` }} />
      </div>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-center shadow-sm backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function InfoLine({ label, value, tone }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.blue}`}>{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const year = new Date().getFullYear();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['main-dashboard', year],
    queryFn: async () => {
      const requests = await Promise.allSettled([
        getExpenseSummary(year),
        getExpenses({ year }),
        getReimbursements({ status: 'pending' }),
        getStockOverview(),
        getPurchaseAnalytics(year),
        getSalesAnalytics(year),
        getOrderStats().then((response) => response.data),
        listCustomerOrders({ limit: 8 }).then((response) => response.data),
        getSupervisorDashboard().then((response) => response.data),
      ]);

      const valueAt = (index, fallback) => (requests[index]?.status === 'fulfilled' ? requests[index].value : fallback);

      return {
        expenseSummary: valueAt(0, null),
        expenses: safeArray(valueAt(1, [])),
        reimbursements: safeArray(valueAt(2, [])),
        stockOverview: valueAt(3, null),
        purchaseAnalytics: valueAt(4, null),
        salesAnalytics: valueAt(5, null),
        orderStats: valueAt(6, null),
        recentOrders: safeArray(valueAt(7, { orders: [] }).orders),
        supervisor: valueAt(8, null),
      };
    },
    staleTime: 30 * 1000,
  });

  const expenseMonthlyTotals = useMemo(() => {
    const rows = MONTHS.map((month) => ({ month, expenses: 0, purchases: 0, revenue: 0 }));

    safeArray(data?.expenseSummary?.monthly).forEach((row) => {
      const bucket = rows[(row.month || 1) - 1];
      if (bucket) bucket.expenses += Number(row.total || 0);
    });

    safeArray(data?.purchaseAnalytics?.monthlySpend).forEach((row) => {
      const bucket = rows[(row._id || 1) - 1];
      if (bucket) bucket.purchases += Number(row.total || 0);
    });

    safeArray(data?.salesAnalytics?.monthlyRevenue).forEach((row) => {
      const bucket = rows[(row._id || 1) - 1];
      if (bucket) bucket.revenue += Number(row.revenue || 0);
    });

    return rows;
  }, [data]);

  const expenseCategoryData = useMemo(() => {
    const totals = new Map();
    safeArray(data?.expenseSummary?.monthly).forEach((row) => {
      const key = row.categoryType || 'other';
      totals.set(key, (totals.get(key) || 0) + Number(row.total || 0));
    });

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name: capitalizeLabel(name),
        value,
        fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
      }));
  }, [data]);

  const supplierSpendData = useMemo(() => {
    const totals = new Map();

    safeArray(data?.expenses).forEach((expense) => {
      const supplierName = String(expense.vendorName || expense.supplier?.name || expense.category?.name || 'Unspecified supplier').trim();
      totals.set(supplierName, (totals.get(supplierName) || 0) + Number(expense.amount || 0));
    });

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        fill: SUPPLIER_COLORS[index % SUPPLIER_COLORS.length],
      }));
  }, [data]);

  const monthlyRevenueData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const row = safeArray(data?.salesAnalytics?.monthlyRevenue).find((entry) => entry._id === index + 1) || {};
      return {
        month,
        revenue: Number(row.revenue || 0),
        paid: Number(row.paid || 0),
      };
    });
  }, [data]);

  const expenseTotal = Number(data?.expenseSummary?.yearTotal || 0);
  const salesTotal = Number(data?.salesAnalytics?.totalRevenue || 0);
  const salesCollected = Number(data?.salesAnalytics?.totalPaid || 0);
  const purchaseSpend = Number(
    safeArray(data?.purchaseAnalytics?.monthlySpend).reduce((sum, row) => sum + Number(row.total || 0), 0)
  );
  const purchasePaid = Number(
    safeArray(data?.purchaseAnalytics?.monthlySpend).reduce((sum, row) => sum + Number(row.paid || 0), 0)
  );
  const outstandingPurchase = Number(data?.purchaseAnalytics?.totalOutstanding || 0);
  const inventoryValue = Number(data?.stockOverview?.totalValue || 0);
  const stockCount = Number(data?.stockOverview?.totalItemsAll ?? data?.stockOverview?.totalItems ?? 0);
  const stockHealth = stockCount > 0 ? clampPercent(100 - ((Number(data?.stockOverview?.lowStock || 0) + Number(data?.stockOverview?.outOfStock || 0)) / stockCount) * 100) : 100;
  const orderOnTime = Number(data?.orderStats?.onTimeRate || 0);
  const activeOrders = Number(data?.orderStats?.active || 0);
  const delayedOrders = Number(data?.orderStats?.delayed || 0);
  const pendingClaims = safeArray(data?.reimbursements);
  const openClaimsTotal = Number(pendingClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0));
  const lineLoad = clampPercent(safeArray(data?.supervisor?.jobs).length * 16);
  const workforceCount = Number(data?.supervisor?.jobs?.length || 0);

  const metrics = [
    {
      label: 'Sales',
      value: formatCurrency(salesTotal),
      note: `${formatCurrency(salesCollected)} collected this year`,
      icon: 'bi-graph-up-arrow',
      accent: 'from-sky-500 to-cyan-500',
    },
    {
      label: 'Expenses',
      value: formatCurrency(expenseTotal),
      note: `${pendingClaims.length} reimbursements pending review`,
      icon: 'bi-receipt',
      accent: 'from-rose-500 to-pink-500',
    },
    {
      label: 'Purchase Spend',
      value: formatCurrency(purchaseSpend),
      note: `${formatCurrency(outstandingPurchase)} outstanding`,
      icon: 'bi-bag-check-fill',
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventoryValue),
      note: `${Number(data?.stockOverview?.lowStock || 0)} low-stock items tracked`,
      icon: 'bi-boxes',
      accent: 'from-teal-500 to-emerald-500',
    },
    {
      label: 'Order Health',
      value: `${orderOnTime}%`,
      note: `${activeOrders} active orders, ${delayedOrders} delayed`,
      icon: 'bi-truck',
      accent: 'from-indigo-500 to-blue-500',
    },
    {
      label: 'Line Workload',
      value: `${workforceCount}`,
      note: `${data?.supervisor?.section?.name || 'Production'} section in focus`,
      icon: 'bi-people-fill',
      accent: 'from-violet-500 to-fuchsia-500',
    },
  ];

  const activity = [];

  if (data?.expenses?.length) {
    const expense = data.expenses[0];
    activity.push({
      module: 'Expense & Employee',
      title: expense.vendorName || expense.category?.name || 'Expense recorded',
      detail: `${capitalizeLabel(expense.paymentMethod)} - ${formatCurrency(expense.amount)}`,
      meta: expense.date ? new Date(expense.date).toLocaleDateString('en-GB') : 'Recent',
      icon: 'bi-receipt',
      tone: 'rose',
    });
  }

  if (pendingClaims.length) {
    const claim = pendingClaims[0];
    activity.push({
      module: 'Expense & Employee',
      title: 'Pending reimbursement approval',
      detail: `${claim.employee?.name || claim.claimantName || 'Employee'} - ${formatCurrency(claim.amount)}`,
      meta: 'Awaiting action',
      icon: 'bi-person-check',
      tone: 'amber',
    });
  }

  if (data?.purchaseAnalytics?.outstanding?.length) {
    const grn = data.purchaseAnalytics.outstanding[0];
    activity.push({
      module: 'Purchase Management',
      title: grn.grnNumber || 'Outstanding GRN',
      detail: `${grn.purchaseOrder?.supplier?.name || 'Supplier'} Â· ${formatCurrency((grn.invoiceAmount || 0) - (grn.amountPaid || 0))} due`,
      meta: grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString('en-GB') : 'Recent',
      icon: 'bi-building',
      tone: 'amber',
    });
  }

  if (data?.stockOverview) {
    activity.push({
      module: 'Stock Control',
      title: `${Number(data.stockOverview.lowStock || 0)} items need replenishment`,
      detail: `${Number(data.stockOverview.outOfStock || 0)} items out of stock - ${formatCurrency(inventoryValue)} inventory value`,
      meta: 'Live inventory snapshot',
      icon: 'bi-boxes',
      tone: 'teal',
    });
  }

  if (data?.recentOrders?.length) {
    const order = data.recentOrders[0];
    activity.push({
      module: 'Order Tracking',
      title: `Order #${order.orderNumber || order._id}`,
      detail: `${order.customerName || 'Customer'} - ${capitalizeLabel(order.status)}`,
      meta: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB') : 'Recent',
      icon: 'bi-truck',
      tone: 'sky',
    });
  }

  if (data?.salesAnalytics) {
    activity.push({
      module: 'Sales & POS',
      title: 'Revenue and collections updated',
      detail: `${formatCurrency(salesTotal)} invoiced - ${formatCurrency(salesCollected)} collected`,
      meta: `${Number(data.salesAnalytics.totalOutstanding || 0) > 0 ? 'Outstanding balances' : 'All collections up to date'}`,
      icon: 'bi-cart-check',
      tone: 'blue',
    });
  }

  if (data?.supervisor) {
    activity.push({
      module: 'Manufacturing',
      title: data.supervisor.section?.name || 'Production section loaded',
      detail: `${safeArray(data.supervisor.jobs).length} jobs visible on the active line`,
      meta: data.supervisor.canCompleteLine ? 'Line supervisor mode' : 'Production overview',
      icon: 'bi-gear-wide-connected',
      tone: 'violet',
    });
  }

  if (data?.orderStats) {
    activity.push({
      module: 'Overview',
      title: `${delayedOrders} delayed order${delayedOrders === 1 ? '' : 's'} monitored`,
      detail: `${orderOnTime}% on-time delivery rate across ${Number(data.orderStats.total || 0)} orders`,
      meta: 'Delivery performance',
      icon: 'bi-speedometer2',
      tone: 'slate',
    });
  }

  const progressItems = [
    {
      label: 'Stock health',
      value: stockHealth,
      note: `${Number(data?.stockOverview?.lowStock || 0)} low-stock and ${Number(data?.stockOverview?.outOfStock || 0)} out-of-stock items`,
      accent: 'from-teal-500 to-emerald-500',
      icon: 'bi-boxes',
    },
    {
      label: 'Purchase settlement',
      value: purchaseSpend > 0 ? clampPercent((purchasePaid / purchaseSpend) * 100) : 100,
      note: `${formatCurrency(purchasePaid)} settled out of ${formatCurrency(purchaseSpend)}`,
      accent: 'from-amber-500 to-orange-500',
      icon: 'bi-bag-check-fill',
    },
    {
      label: 'On-time orders',
      value: orderOnTime,
      note: `${activeOrders} active and ${delayedOrders} delayed orders`,
      accent: 'from-sky-500 to-cyan-500',
      icon: 'bi-truck',
    },
    {
      label: 'Reimbursement queue',
      value: clampPercent(pendingClaims.length * 18),
      note: `${pendingClaims.length} requests worth ${formatCurrency(openClaimsTotal)}`,
      accent: 'from-rose-500 to-pink-500',
      icon: 'bi-person-check',
    },
    {
      label: 'Line workload',
      value: lineLoad,
      note: `${workforceCount} jobs visible in the active section`,
      accent: 'from-violet-500 to-fuchsia-500',
      icon: 'bi-people-fill',
    },
  ];

  return (
    <div className="relative space-y-6 pb-10">
      <div className="pointer-events-none absolute -top-12 -left-16 h-44 w-44 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-36 -right-20 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="relative isolate px-6 py-7 sm:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(199,210,254,0.35),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(240,249,255,0.92))]" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Unified business dashboard
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Central command center for the full ERP</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  A single premium workspace for Overview, People, Expense & Employee, Purchase Management, Manufacturing, Stock Control, Sales & POS, and Order Tracking.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
              <MiniStat label="Modules" value="8" hint="connected" />
              <MiniStat label="Open orders" value={String(activeOrders)} hint="in motion" />
              <MiniStat label="Alerts" value={String(Number(data?.stockOverview?.lowStock || 0) + Number(data?.stockOverview?.outOfStock || 0))} hint="stock risks" />
              <MiniStat label="Claims" value={String(pendingClaims.length)} hint="pending review" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <DashboardMetric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Main component access</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Every module is visible from one balanced entry point</h2>
          </div>
          <Link to="/orders/dashboard" className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100">
            <i className="bi bi-arrow-right-circle" />
            Open tracking
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MODULES.map((module) => (
            <ModuleCard key={module.label} module={module} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="flex h-full flex-col gap-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Quick insights</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Cross-module operational flow</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Expenses</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Purchases</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Revenue</span>
              </div>
            </div>
            <div className="mt-5 h-[240px] sm:h-[320px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-400">Loading analytics...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseMonthlyTotals} margin={{ top: 10, right: 18, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), capitalizeLabel(name)]}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}
                    />
                    {!isMobile && <Legend />}
                    <Bar dataKey="expenses" name="Expenses" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchases" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:min-h-[640px] sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Finance mix</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Expense distribution</h3>
                </div>
                <Link to="/expenses" className="text-sm font-medium text-sky-700 hover:text-sky-900">Open expenses</Link>
              </div>
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5">
                  <div className="space-y-4">
                    <div className="mx-auto h-[180px] w-full max-w-[320px] overflow-visible sm:h-[220px]">
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-slate-400">Loading chart...</div>
                      ) : expenseCategoryData.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">No expense data yet.</div>
                      ) : (
                        <div className="flex h-full items-center justify-center overflow-visible p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={expenseCategoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 24 : 44}
                                outerRadius={isMobile ? 48 : 72}
                                paddingAngle={3}
                              >
                              {expenseCategoryData.map((entry, index) => (
                                <Cell key={entry.name} fill={entry.fill || EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                              ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              {!isMobile && <Legend />}
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {expenseCategoryData.slice(0, 4).map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 text-[13px] last:border-b-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="truncate font-medium text-slate-600">{entry.name}</span>
                          </div>
                          <span className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spend by Supplier</p>
                  <div className="mt-4 space-y-4">
                    <div className="mx-auto h-[180px] w-full max-w-[320px] overflow-visible sm:h-[220px]">
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-slate-400">Loading supplier spend...</div>
                      ) : supplierSpendData.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">No supplier spend data yet.</div>
                      ) : (
                        <div className="flex h-full items-center justify-center overflow-visible p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={supplierSpendData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 24 : 44}
                                outerRadius={isMobile ? 48 : 72}
                                paddingAngle={3}
                              >
                              {supplierSpendData.map((entry, index) => (
                                <Cell key={entry.name} fill={entry.fill || SUPPLIER_COLORS[index % SUPPLIER_COLORS.length]} />
                              ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              {!isMobile && <Legend />}
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {supplierSpendData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 text-[13px] last:border-b-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="truncate font-medium text-slate-600">{entry.name}</span>
                          </div>
                          <span className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Collections</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Revenue vs collections</h3>
              </div>
              <div className="mt-4 h-[200px] sm:h-[230px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-400">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Invoiced" stroke="#0ea5e9" fill="url(#revenueGradient)" strokeWidth={2} />
                      <Area type="monotone" dataKey="paid" name="Collected" stroke="#10b981" fill="url(#paidGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {progressItems.map((item) => (
                  <ProgressRow key={item.label} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">System summary</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Quick operational snapshot</h3>
              </div>
              <Link to="/manufacturing/overview" className="text-sm font-medium text-sky-700 hover:text-sky-900">Manufacturing</Link>
            </div>
            <div className="mt-4 space-y-3">
              <InfoLine label="Inventory risk" value={`${Number(data?.stockOverview?.lowStock || 0)} low / ${Number(data?.stockOverview?.outOfStock || 0)} out`} tone="teal" />
              <InfoLine label="Purchase payments" value={`${formatCurrency(purchasePaid)} settled`} tone="amber" />
              <InfoLine label="Sales outstanding" value={formatCurrency(Number(data?.salesAnalytics?.totalOutstanding || 0))} tone="blue" />
              <InfoLine label="Open claims" value={`${pendingClaims.length} pending`} tone="rose" />
              <InfoLine label="Production section" value={data?.supervisor?.section?.name || 'Overview mode'} tone="violet" />
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Navigation clarity</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Direct links for every module</h3>
              </div>
            </div>
            <div className="mt-5 flex-1 space-y-3">
              {MODULES.map((module) => (
                <Link
                  key={module.label}
                  to={module.to}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3.5 transition-colors hover:border-sky-200 hover:bg-white"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${module.tone} text-white`}>
                    <i className={`bi ${module.icon}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{module.label}</p>
                    <p className="truncate text-xs leading-5 text-slate-500">{module.description}</p>
                  </div>
                  <i className="bi bi-chevron-right text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recent activity</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Latest updates across the system</h2>
          </div>
          <div className="text-sm text-slate-500">{year} operational stream</div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white">
          <div className="divide-y divide-slate-100">
            {activity.slice(0, 8).map((item) => (
              <div key={`${item.module}-${item.title}`} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                    <i className={`bi ${item.icon} text-lg`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.module}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-400">{item.meta}</div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-400">No recent activity available yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
