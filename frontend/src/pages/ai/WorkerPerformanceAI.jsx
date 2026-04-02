import { useQuery } from '@tanstack/react-query';
import { getWorkerPerformance } from '../../api/ai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function TrendIcon({ trend }) {
  if (trend === 'up') return <i className="bi bi-arrow-up-short text-emerald-500 text-lg" />;
  if (trend === 'down') return <i className="bi bi-arrow-down-short text-red-500 text-lg" />;
  return <i className="bi bi-dash text-slate-400 text-lg" />;
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700'
    : score >= 65 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    'Senior Operator': 'bg-indigo-100 text-indigo-700',
    'Operator': 'bg-blue-100 text-blue-700',
    'Trainee': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[role] || 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

export default function WorkerPerformanceAI() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-worker-performance'],
    queryFn: () => getWorkerPerformance().then(r => r.data),
  });

  const workers = data?.workers || [];

  // Prepare chart data (top 8)
  const chartData = workers.slice(0, 8).map(w => ({
    name: w.name?.split(' ')[0] || 'Worker',
    score: w.efficiency_score,
    output: w.avg_hourly_output,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-people text-indigo-600" />
          Worker Performance AI
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          AI-computed performance scores based on output history, QC pass rate, and attendance.
        </p>
      </div>

      {/* Summary */}
      {!isLoading && workers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Workers', value: workers.length, icon: 'bi-people', color: 'indigo' },
            { label: 'Top Performers', value: workers.filter(w => w.efficiency_score >= 80).length, icon: 'bi-star', color: 'emerald' },
            { label: 'Avg AI Score', value: Math.round(workers.reduce((s, w) => s + w.efficiency_score, 0) / workers.length) || 0, icon: 'bi-speedometer2', color: 'amber' },
            { label: 'Need Training', value: workers.filter(w => w.efficiency_score < 65).length, icon: 'bi-person-exclamation', color: 'red' },
          ].map(item => (
            <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-200 rounded-xl p-4`}>
              <i className={`bi ${item.icon} text-${item.color}-600 text-xl`} />
              <p className={`text-2xl font-bold text-${item.color}-700 mt-2`}>{item.value}</p>
              <p className={`text-xs text-${item.color}-600`}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="bi bi-bar-chart text-indigo-500" />
            AI Efficiency Scores — Top Workers
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === 'score' ? 'AI Score' : 'Avg Output/Hr']} />
              <Bar dataKey="score" name="AI Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="output" name="Avg Output/Hr" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Worker Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="bi bi-table text-slate-500" />
            Worker AI Analysis Table
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <span className="animate-pulse flex items-center justify-center gap-2">
              <i className="bi bi-cpu" /> Loading AI analysis...
            </span>
          </div>
        ) : workers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="bi bi-people text-3xl block mb-2" />
            No employee data found. Add employees via Employee Management to activate AI scoring.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Worker</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-center">AI Score</th>
                  <th className="px-4 py-3 text-center">Avg Output/Hr</th>
                  <th className="px-4 py-3 text-center">QC Pass %</th>
                  <th className="px-4 py-3 text-center">Shifts</th>
                  <th className="px-4 py-3 text-center">Trend</th>
                  <th className="px-4 py-3 text-left">Best Fit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((w, i) => (
                  <tr key={w._id} className={`hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {i === 0 && <i className="bi bi-star-fill text-amber-400 mr-1 text-xs" />}
                      {w.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{w.role}</td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={w.efficiency_score} /></td>
                    <td className="px-4 py-3 text-center font-semibold">{w.avg_hourly_output}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${w.qc_pass_rate >= 95 ? 'text-emerald-600' : w.qc_pass_rate >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                        {w.qc_pass_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{w.shifts_worked}</td>
                    <td className="px-4 py-3 text-center"><TrendIcon trend={w.trend} /></td>
                    <td className="px-4 py-3"><RoleBadge role={w.best_fit_role} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
