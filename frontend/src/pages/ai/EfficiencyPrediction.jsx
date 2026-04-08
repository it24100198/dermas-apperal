import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { predictEfficiency } from '../../api/ai';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function StatusBadge({ status }) {
  const map = {
    good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    risk: 'bg-red-100 text-red-700 border-red-200',
  };
  const icons = { good: 'bi-check-circle-fill', warning: 'bi-exclamation-circle-fill', risk: 'bi-x-circle-fill' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${map[status] || map.warning}`}>
      <i className={`bi ${icons[status]}`} />
      {status === 'good' ? 'ON TARGET' : status === 'warning' ? 'WARNING' : 'AT RISK'}
    </span>
  );
}

export default function EfficiencyPrediction() {
  const [form, setForm] = useState({
    workers_count: 12,
    target_per_hour: 60,
    avg_experience_months: 12,
    line_age_days: 45,
    line_name: 'Line 1',
  });

  const { mutate, data: result, isPending, isError } = useMutation({
    mutationFn: predictEfficiency,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({
      workers_count: Number(form.workers_count),
      target_per_hour: Number(form.target_per_hour),
      avg_experience_months: Number(form.avg_experience_months),
      line_age_days: Number(form.line_age_days),
      line_name: form.line_name,
    });
  };

  const effColor = result
    ? result.status === 'good' ? '#10b981'
    : result.status === 'warning' ? '#f59e0b'
    : '#ef4444'
    : '#6366f1';

  const gaugeData = result ? [{ value: result.efficiency_percent, fill: effColor }] : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-speedometer2 text-indigo-600" />
          Efficiency AI Prediction
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Predict line efficiency & hourly output using our Decision Tree AI model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="bi bi-sliders text-slate-500" /> Line Parameters
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Line Name</label>
              <input
                id="efficiency-line"
                type="text"
                value={form.line_name}
                onChange={e => setForm(f => ({ ...f, line_name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. Line 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Workers Count</label>
                <input
                  id="efficiency-workers"
                  type="number" min="1" max="50"
                  value={form.workers_count}
                  onChange={e => setForm(f => ({ ...f, workers_count: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target / Hour</label>
                <input
                  id="efficiency-target"
                  type="number" min="1"
                  value={form.target_per_hour}
                  onChange={e => setForm(f => ({ ...f, target_per_hour: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avg Experience (months)</label>
                <input
                  id="efficiency-experience"
                  type="number" min="0"
                  value={form.avg_experience_months}
                  onChange={e => setForm(f => ({ ...f, avg_experience_months: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Line Active Days</label>
                <input
                  id="efficiency-line-days"
                  type="number" min="0"
                  value={form.line_age_days}
                  onChange={e => setForm(f => ({ ...f, line_age_days: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {isError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                AI service unavailable. Please try again.
              </p>
            )}

            <button
              id="efficiency-predict-btn"
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Predicting...</>
              ) : (
                <><i className="bi bi-cpu" /> Predict Efficiency</>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-slate-800">Efficiency Score</h2>
                  <StatusBadge status={result.status} />
                </div>

                <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="100%"
                      innerRadius="60%"
                      outerRadius="90%"
                      startAngle={180}
                      endAngle={0}
                      data={[{ value: 100, fill: '#e2e8f0' }, ...gaugeData]}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={8} background={false} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-4xl font-black" style={{ color: effColor }}>
                      {result.efficiency_percent}%
                    </p>
                    <p className="text-xs text-slate-500">Efficiency</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Predicted / Hour</p>
                    <p className="text-2xl font-bold text-slate-800">{result.predicted_hourly_output}</p>
                    <p className="text-xs text-slate-400">units</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Daily Estimate</p>
                    <p className="text-2xl font-bold text-slate-800">{result.daily_output_estimate}</p>
                    <p className="text-xs text-slate-400">units (8hr shift)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Model Confidence</span>
                  <span className="text-sm font-bold text-indigo-700">{result.confidence}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <i className="bi bi-robot text-indigo-500 mr-2" />
                  <span className="text-sm text-indigo-800">{result.explanation}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="min-h-[300px] bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="bi bi-speedometer2 text-3xl text-indigo-500" />
              </div>
              <h3 className="font-semibold text-slate-700">Enter line details</h3>
              <p className="text-sm text-slate-500">
                Fill in the line parameters and run the AI model to see efficiency predictions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
