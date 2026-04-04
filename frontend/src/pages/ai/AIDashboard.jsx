import { useQuery } from '@tanstack/react-query';
import { getAIDashboard } from '../../api/ai';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

function KpiCard({ title, value, unit, icon, color, sub, trend }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    red: 'from-red-500 to-red-700',
  };
  const trendIcon = trend === 'up' ? 'bi-arrow-up-short' : trend === 'down' ? 'bi-arrow-down-short' : 'bi-dash';
  const trendColor = trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-red-300' : 'text-slate-300';
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <i className={`bi ${icon} text-2xl opacity-90`} />
          {trend && <span className={`text-sm font-medium ${trendColor} flex items-center gap-0.5`}>
            <i className={`bi ${trendIcon}`} /> {trend}
          </span>}
        </div>
        <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
        <p className="text-3xl font-bold">
          {value}<span className="text-base font-normal ml-1 opacity-80">{unit}</span>
        </p>
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AIDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: () => getAIDashboard().then(r => r.data),
    refetchInterval: 60000,
  });

  const trendData = data?.trend
    ? data.trend.labels.map((label, i) => ({
        name: label,
        predicted: data.trend.predicted[i],
        actual: data.trend.actual[i],
      }))
    : [];

  const workerTrendData = data?.worker_trend
    ? data.worker_trend.labels.map((label, i) => ({
        name: label,
        score: data.worker_trend.scores[i],
      }))
    : [];

  const lineEff = data?.line_efficiency || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-cpu text-indigo-600" />
            AI Production Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ML-powered predictions and smart insights for your factory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?._source === 'realtime_db' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Data
            </span>
          )}
          <span className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            AI Engine Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Est. Daily Output"
            value={data?.predicted_daily_output > 0 ? data.predicted_daily_output.toLocaleString() : '—'}
            unit={data?.predicted_daily_output > 0 ? 'pcs' : ''}
            icon="bi-graph-up"
            color="indigo"
            trend={data?.predicted_daily_output > 0 ? 'up' : 'stable'}
            sub={data?.predicted_daily_output > 0 ? '7-day daily average (real)' : 'No production data yet'}
          />
          <KpiCard
            title="Efficiency vs Daily Avg"
            value={data?.efficiency_score != null ? data.efficiency_score : '—'}
            unit={data?.efficiency_score != null ? '%' : ''}
            icon="bi-speedometer2"
            color="emerald"
            trend={data?.efficiency_score == null ? 'stable' : data.efficiency_score >= 80 ? 'up' : data.efficiency_score >= 60 ? 'stable' : 'down'}
            sub={data?.efficiency_score != null ? 'Today vs 7-day avg (real)' : 'Start entering production data'}
          />
          <KpiCard
            title="Avg Fabric Wastage"
            value={data?.wastage_percent != null ? data.wastage_percent : '—'}
            unit={data?.wastage_percent != null ? '%' : ''}
            icon="bi-recycle"
            color="amber"
            trend={data?.wastage_percent == null ? 'stable' : data.wastage_percent < 6 ? 'up' : data.wastage_percent < 10 ? 'stable' : 'down'}
            sub={data?.wastage_percent != null ? 'From actual cutting records' : 'Complete cutting records to track'}
          />
          <KpiCard
            title="Active Risk Alerts"
            value={data?.risk_alerts ?? 0}
            unit=""
            icon="bi-exclamation-triangle"
            color="red"
            trend={data?.risk_alerts === 0 ? 'up' : 'down'}
            sub={data?.risk_alerts === 0 ? 'All systems normal' : 'Auto-detected from real data'}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predicted vs Actual */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="bi bi-graph-up-arrow text-indigo-500" />
            Target vs Actual Output (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="predicted" name="Target" stroke="#6366f1" fill="url(#colorPredicted)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="actual" name="Actual Output" stroke="#10b981" fill="url(#colorActual)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Line Efficiency */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="bi bi-bar-chart text-emerald-500" />
            Line Efficiency Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lineEff}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="line" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Efficiency']} />
              <Bar
                dataKey="efficiency"
                name="Efficiency %"
                radius={[6, 6, 0, 0]}
                fill="#6366f1"
                label={{ position: 'top', fontSize: 11, formatter: (v) => `${v}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worker Trend */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="bi bi-people text-amber-500" />
          Worker Performance Trend (AI Score)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={workerTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v}`, 'AI Score']} />
            <Line type="monotone" dataKey="score" name="AI Score" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { to: '/ai/wastage', icon: 'bi-recycle', label: 'Wastage Prediction', color: 'amber', desc: 'Predict fabric loss' },
          { to: '/ai/efficiency', icon: 'bi-speedometer2', label: 'Efficiency AI', color: 'indigo', desc: 'Line & worker efficiency' },
          { to: '/ai/suggestions', icon: 'bi-lightbulb', label: 'Smart Suggestions', color: 'emerald', desc: 'AI-powered recommendations' },
          { to: '/ai/worker-performance', icon: 'bi-people', label: 'Worker AI', color: 'blue', desc: 'Performance scoring' },
          { to: '/ai/alerts', icon: 'bi-bell', label: 'Alerts', color: 'red', desc: 'Active risk alerts' },
          { to: '/jobs', icon: 'bi-briefcase', label: 'View Jobs', color: 'slate', desc: 'Per-job AI predictions' },
        ].map((item) => (
          <a
            key={item.to}
            href={item.to}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <i className={`bi ${item.icon} text-xl text-slate-600 group-hover:text-indigo-600 transition-colors`} />
            <p className="font-medium text-slate-800 mt-2 text-sm">{item.label}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
