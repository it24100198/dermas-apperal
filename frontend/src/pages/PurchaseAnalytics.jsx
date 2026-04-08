import { useEffect, useMemo, useState } from 'react';
import { getPurchaseAnalytics, getSuppliers, getGRNs, getMaterials, getPurchaseOrders } from '../api/purchase';
import { downloadCsv } from '../utils/csvExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

function formatLKR(n) {
  return `Rs. ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

export default function PurchaseAnalytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const [data, setData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [grns, setGrns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOutstanding, setDetailOutstanding] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summary, supplierList, grnList, materialList, orderList] = await Promise.all([
          getPurchaseAnalytics(year),
          getSuppliers(),
          getGRNs(),
          getMaterials(),
          getPurchaseOrders(),
        ]);
        setData(summary);
        setSuppliers(supplierList);
        setGrns(grnList);
        setMaterials(materialList);
        setOrders(orderList);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  const filteredGRNs = useMemo(() => {
    return grns.filter((g) => {
      const received = new Date(g.receivedDate);
      const yearMatch = received.getFullYear() === year;
      const monthMatch = month === 'all' ? true : received.getMonth() + 1 === Number(month);
      const supplierId = g.purchaseOrder?.supplier?._id;
      const supplierMatch = supplierFilter === 'all' ? true : supplierId === supplierFilter;
      return yearMatch && monthMatch && supplierMatch;
    });
  }, [grns, year, month, supplierFilter]);

  const monthlyData = useMemo(() => {
    const totals = MONTHS.map((name, idx) => ({ name, spend: 0, paid: 0, month: idx + 1 }));
    filteredGRNs.forEach((g) => {
      const m = new Date(g.receivedDate).getMonth();
      totals[m].spend += Number(g.invoiceAmount || 0);
      totals[m].paid += Number(g.amountPaid || 0);
    });
    return totals;
  }, [filteredGRNs]);

  const spendBySupplier = useMemo(() => {
    const map = new Map();
    filteredGRNs.forEach((g) => {
      const supplierName = g.purchaseOrder?.supplier?.name || 'Unknown';
      const current = map.get(supplierName) || 0;
      map.set(supplierName, current + Number(g.invoiceAmount || 0));
    });

    return Array.from(map.entries())
      .map(([name, value], idx) => ({ name, value, fill: PIE_COLORS[idx % PIE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredGRNs]);

  const totalSpend = monthlyData.reduce((sum, item) => sum + item.spend, 0);
  const totalPaid = monthlyData.reduce((sum, item) => sum + item.paid, 0);
  const totalOutstanding = totalSpend - totalPaid;

  const topSupplier = spendBySupplier[0]?.name || '-';

  const highestSpendMonth = useMemo(() => {
    const top = monthlyData.reduce((max, m) => (m.spend > max.spend ? m : max), { spend: 0, name: '-' });
    return top.spend > 0 ? `${top.name} (${formatLKR(top.spend)})` : '-';
  }, [monthlyData]);

  const mostOrderedMaterial = useMemo(() => {
    const quantityByMaterial = new Map();

    orders.forEach((po) => {
      po.items?.forEach((item) => {
        const materialName = item.material?.name || item.description || 'Unknown';
        const qty = Number(item.qty || 0);
        quantityByMaterial.set(materialName, (quantityByMaterial.get(materialName) || 0) + qty);
      });
    });

    let top = { name: '-', qty: 0 };
    quantityByMaterial.forEach((qty, name) => {
      if (qty > top.qty) top = { name, qty };
    });

    return top.qty > 0 ? `${top.name} (${top.qty})` : '-';
  }, [orders, materials]);

  const overduePaymentCount = useMemo(() => {
    const today = new Date();
    return filteredGRNs.filter((g) => {
      if (g.paymentStatus === 'paid') return false;
      const received = new Date(g.receivedDate);
      const diffDays = Math.floor((today - received) / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).length;
  }, [filteredGRNs]);

  const outstandingRows = filteredGRNs
    .filter((g) => g.paymentStatus === 'unpaid' || g.paymentStatus === 'partial')
    .map((g) => ({
      ...g,
      outstanding: Number(g.invoiceAmount || 0) - Number(g.amountPaid || 0),
    }))
    .sort((a, b) => b.outstanding - a.outstanding);

  const exportOutstandingCsv = () => {
    downloadCsv({
      fileName: 'purchase-outstanding-export.csv',
      columns: [
        { header: 'GRN', accessor: (g) => g.grnNumber },
        { header: 'Supplier', accessor: (g) => g.purchaseOrder?.supplier?.name || '-' },
        { header: 'Invoice Amount', accessor: (g) => g.invoiceAmount || 0 },
        { header: 'Paid', accessor: (g) => g.amountPaid || 0 },
        { header: 'Outstanding', accessor: (g) => g.outstanding || 0 },
        { header: 'Payment Status', accessor: (g) => g.paymentStatus },
        { header: 'Received Date', accessor: (g) => new Date(g.receivedDate).toLocaleDateString('en-GB') },
      ],
      rows: outstandingRows,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Purchase Analytics</h1>
        <p className="text-slate-500 text-sm">Spend trends, supplier contributions, and outstanding payments</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All months</option>
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: formatLKR(totalSpend), icon: 'bi-cash-stack', color: 'from-indigo-500 to-indigo-700' },
          { label: 'Total Paid', value: formatLKR(totalPaid), icon: 'bi-check2-circle', color: 'from-emerald-500 to-emerald-700' },
          { label: 'Outstanding', value: formatLKR(totalOutstanding), icon: 'bi-exclamation-circle-fill', color: 'from-rose-500 to-rose-700' },
          { label: 'Overdue Payments', value: overduePaymentCount, icon: 'bi-clock-history', color: 'from-amber-500 to-amber-700' },
        ].map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} text-white rounded-xl p-5 shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{card.label}</span>
              <i className={`bi ${card.icon} text-2xl opacity-80`} />
            </div>
            <p className="text-2xl font-bold">{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Top Supplier</p>
          <p className="text-base font-semibold text-slate-800">{topSupplier}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Highest Spend Month</p>
          <p className="text-base font-semibold text-slate-800">{highestSpendMonth}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Most Ordered Material</p>
          <p className="text-base font-semibold text-slate-800">{mostOrderedMaterial}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Records in Scope</p>
          <p className="text-base font-semibold text-slate-800">{filteredGRNs.length} GRNs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Monthly Spend vs Paid ({year})</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : totalSpend === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <i className="bi bi-bar-chart-line text-3xl mb-2 opacity-40" />
              No spend data for selected filters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                <Tooltip formatter={(v) => [formatLKR(v)]} />
                <Legend />
                <Bar dataKey="spend" name="Total Spend" fill="#6366f1" radius={2} />
                <Bar dataKey="paid" name="Amount Paid" fill="#10b981" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Spend by Supplier</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : spendBySupplier.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 text-sm">
              <i className="bi bi-pie-chart text-3xl mb-2 opacity-40" />
              No supplier spend data.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={spendBySupplier} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {spendBySupplier.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatLKR(v)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {spendBySupplier.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-slate-600 truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatLKR(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <i className="bi bi-exclamation-circle-fill text-rose-500" />
          <h2 className="font-semibold text-slate-700">Outstanding Payments</h2>
          {!loading && outstandingRows.length > 0 && (
            <span className="ml-auto text-sm font-bold text-rose-600">{formatLKR(totalOutstanding)}</span>
          )}
          {!loading && outstandingRows.length > 0 && (
            <button onClick={exportOutstandingCsv} className="ml-3 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <i className="bi bi-download" /> Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : outstandingRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="bi bi-check-circle-fill text-emerald-400 text-2xl block mb-2" />
            No outstanding payments in selected scope.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                {['GRN', 'Supplier', 'Invoice Amount', 'Paid', 'Outstanding', 'Status', 'Received', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outstandingRows.map((g) => (
                <tr key={g._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{g.grnNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{g.purchaseOrder?.supplier?.name || '-'}</td>
                  <td className="px-4 py-3">{formatLKR(g.invoiceAmount || 0)}</td>
                  <td className="px-4 py-3 text-emerald-700">{formatLKR(g.amountPaid || 0)}</td>
                  <td className="px-4 py-3 font-bold text-rose-600">{formatLKR(g.outstanding || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {g.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(g.receivedDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailOutstanding(g)} className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailOutstanding && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailOutstanding(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Outstanding Detail</h3>
              <button onClick={() => setDetailOutstanding(null)} className="text-slate-400 hover:text-slate-600"><i className="bi bi-x-lg" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">GRN:</span> <span className="font-medium text-slate-800">{detailOutstanding.grnNumber}</span></p>
              <p><span className="text-slate-500">Supplier:</span> <span className="text-slate-700">{detailOutstanding.purchaseOrder?.supplier?.name || '-'}</span></p>
              <p><span className="text-slate-500">Invoice Amount:</span> <span className="text-slate-700">{formatLKR(detailOutstanding.invoiceAmount || 0)}</span></p>
              <p><span className="text-slate-500">Paid:</span> <span className="text-slate-700">{formatLKR(detailOutstanding.amountPaid || 0)}</span></p>
              <p><span className="text-slate-500">Outstanding:</span> <span className="text-slate-700">{formatLKR(detailOutstanding.outstanding || 0)}</span></p>
              <p><span className="text-slate-500">Status:</span> <span className="text-slate-700 capitalize">{detailOutstanding.paymentStatus}</span></p>
              <p><span className="text-slate-500">Received:</span> <span className="text-slate-700">{new Date(detailOutstanding.receivedDate).toLocaleDateString('en-GB')}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
