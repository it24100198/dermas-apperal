import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getManufacturingOverview } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const CARD_COLORS = [
  { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', icon: 'bi-briefcase-fill' },
  { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-700', icon: 'bi-scissors' },
  { bg: 'bg-cyan-50', border: 'border-l-cyan-500', text: 'text-cyan-700', icon: 'bi-list-task' },
  { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700', icon: 'bi-droplet' },
  { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-700', icon: 'bi-box-seam' },
  { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-700', icon: 'bi-check-circle-fill' },
];

export default function ManufacturingOverview() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['manufacturing-overview'],
    queryFn: () => getManufacturingOverview().then((r) => r.data),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  const { kpis, recentJobs } = data || {};

  const cards = [
    { label: 'Total Jobs', value: kpis?.totalJobs ?? 0, ...CARD_COLORS[0] },
    { label: 'Fabric / Cutting', value: kpis?.fabricCutting ?? 0, ...CARD_COLORS[1] },
    { label: 'Line Assigned', value: kpis?.lineAssigned ?? 0, ...CARD_COLORS[2] },
    { label: 'Washing', value: kpis?.washing ?? 0, ...CARD_COLORS[3] },
    { label: 'After Wash / Packing', value: kpis?.afterWashPacking ?? 0, ...CARD_COLORS[4] },
    { label: 'Warehouse', value: kpis?.warehouse ?? 0, ...CARD_COLORS[5] },
  ];

  const barData = [
    { name: 'Fabric/Cutting', count: kpis?.fabricCutting ?? 0, fill: CHART_COLORS[0] },
    { name: 'Line', count: kpis?.lineAssigned ?? 0, fill: CHART_COLORS[1] },
    { name: 'Washing', count: kpis?.washing ?? 0, fill: CHART_COLORS[2] },
    { name: 'Packing', count: kpis?.afterWashPacking ?? 0, fill: CHART_COLORS[3] },
    { name: 'Warehouse', count: kpis?.warehouse ?? 0, fill: CHART_COLORS[4] },
  ];

  const pieData = barData
    .filter((d) => d.count > 0)
    .map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-slate-500 text-sm">Manufacturing / Overview</p>
        <h1 className="text-2xl font-bold text-slate-800">Manufacturing Summary</h1>
      </div>

      {/* KPI cards - colourful */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border border-slate-100 border-l-4 ${c.border} ${c.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <p className="text-sm font-medium text-slate-600">{c.label}</p>
            <p className={`text-2xl font-bold ${c.text} mt-1`}>{c.value}</p>
            <i className={`bi ${c.icon} text-2xl opacity-60 mt-2 block ${c.text}`} />
          </div>
        ))}
      </div>

      {/* Summary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="bi bi-bar-chart-fill text-blue-500" />
            Jobs by Stage
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value) => [value, 'Jobs']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" name="Jobs" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="bi bi-pie-chart-fill text-violet-500" />
            Distribution
          </h2>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <span>No data to show yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent jobs table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-800 flex items-center gap-2">
          <i className="bi bi-clock-history text-slate-500" />
          Recent Jobs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(recentJobs || []).map((job) => (
                <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{job.jobNumber}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">{job.productId?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${job._id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!recentJobs || recentJobs.length === 0) && (
          <p className="px-4 py-8 text-slate-500 text-center">No recent jobs</p>
        )}
      </div>
    </div>
  );
}
