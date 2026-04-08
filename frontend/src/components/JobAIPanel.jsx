/**
 * JobAIPanel — AI predictions panel shown inside each Job Detail page.
 * Fetches AI summary for the specific job and displays:
 * - Wastage prediction + risk
 * - Efficiency prediction + status
 * - Predicted vs Actual comparison
 * - Top suggestions for THIS job
 * - Active alerts for THIS job
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobAISummary } from '../api/ai';

function MiniGauge({ value, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RiskPill({ level }) {
  const map = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };
  const icons = { low: 'bi-check-circle', medium: 'bi-exclamation-circle', high: 'bi-x-circle' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${map[level] || map.medium}`}>
      <i className={`bi ${icons[level] || 'bi-dash'}`} />
      {(level || 'medium').toUpperCase()} RISK
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    good: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    risk: 'bg-red-100 text-red-700',
  };
  const labels = { good: 'ON TARGET', warning: 'WARNING', risk: 'AT RISK' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${map[status] || map.warning}`}>
      {labels[status] || 'CHECKING'}
    </span>
  );
}

function SuggestionMini({ s }) {
  const colors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-amber-500 bg-amber-50',
    low: 'border-l-emerald-500 bg-emerald-50',
  };
  const textColors = { high: 'text-red-700', medium: 'text-amber-700', low: 'text-emerald-700' };
  return (
    <div className={`border-l-4 ${colors[s.priority]} rounded-r-xl px-3 py-2 text-xs`}>
      <i className={`bi ${s.icon} mr-1 ${textColors[s.priority]}`} />
      <span className="text-slate-700">{s.message}</span>
    </div>
  );
}

function AlertMini({ a }) {
  const colors = { critical: 'text-red-600', warning: 'text-amber-600', info: 'text-emerald-600' };
  return (
    <div className="flex items-start gap-2 text-xs text-slate-700">
      <i className={`bi ${a.icon} mt-0.5 ${colors[a.severity]}`} />
      <span>{a.message}</span>
    </div>
  );
}

export default function JobAIPanel({ jobId, jobNumber }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job-ai', jobId],
    queryFn: () => getJobAISummary(jobId).then(r => r.data),
    enabled: !!jobId && open,
    staleTime: 5 * 60 * 1000,
  });

  const wastage = data?.wastage;
  const efficiency = data?.efficiency;
  const comparison = data?.comparison;
  const suggestions = (data?.suggestions || []).slice(0, 3);
  const alerts = (data?.alerts || []).filter(a => !a.acknowledged).slice(0, 3);

  return (
    <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-2xl overflow-hidden shadow-xl">
      {/* Header — always visible */}
      <button
        type="button"
        id={`job-ai-panel-${jobId}`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <i className="bi bi-cpu text-indigo-400 text-lg" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI Production Intelligence</p>
            <p className="text-indigo-300 text-xs">Predictions for {jobNumber}</p>
          </div>
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI Active
          </span>
          <i className={`bi bi-chevron-down text-indigo-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expandable content */}
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 border-t border-white/10">
            {isLoading ? (
              <div className="flex items-center gap-3 py-8 text-indigo-300 justify-center">
                <span className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-sm">Running AI models for {jobNumber}…</span>
              </div>
            ) : isError ? (
              <div className="py-6 text-center text-indigo-300 text-sm">
                <i className="bi bi-wifi-off text-2xl block mb-2" />
                AI service offline. Start the Python service to enable predictions.
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {/* Two col: Wastage + Efficiency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Wastage */}
                  <div className="bg-white/8 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-indigo-200 text-xs font-medium flex items-center gap-1.5">
                        <i className="bi bi-recycle text-amber-400" /> Wastage Prediction
                      </span>
                      {wastage && <RiskPill level={wastage.risk_level} />}
                    </div>
                    {wastage ? (
                      <>
                        <p className="text-4xl font-black text-white mb-2">
                          {wastage.wastage_percent}
                          <span className="text-lg font-normal text-indigo-300 ml-1">%</span>
                        </p>
                        {wastage.fabric_loss_estimate && (
                          <p className="text-xs text-indigo-300">
                            ~{wastage.fabric_loss_estimate} yards/kg fabric loss
                          </p>
                        )}
                        <div className="mt-3">
                          <MiniGauge
                            value={wastage.wastage_percent}
                            max={15}
                            color={wastage.risk_level === 'high' ? '#ef4444' : wastage.risk_level === 'low' ? '#10b981' : '#f59e0b'}
                          />
                          <div className="flex justify-between text-xs text-indigo-400 mt-1">
                            <span>0%</span>
                            <span>Confidence: {wastage.confidence}%</span>
                            <span>15%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-indigo-400 text-sm">No data</p>
                    )}
                  </div>

                  {/* Efficiency */}
                  <div className="bg-white/8 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-indigo-200 text-xs font-medium flex items-center gap-1.5">
                        <i className="bi bi-speedometer2 text-emerald-400" /> Efficiency
                      </span>
                      {efficiency && <StatusPill status={efficiency.status} />}
                    </div>
                    {efficiency ? (
                      <>
                        <p className="text-4xl font-black text-white mb-2">
                          {efficiency.efficiency_percent}
                          <span className="text-lg font-normal text-indigo-300 ml-1">%</span>
                        </p>
                        <p className="text-xs text-indigo-300">
                          ~{efficiency.predicted_hourly_output} units/hr · {efficiency.daily_output_estimate} units/day
                        </p>
                        <div className="mt-3">
                          <MiniGauge
                            value={efficiency.efficiency_percent}
                            max={100}
                            color={efficiency.status === 'good' ? '#10b981' : efficiency.status === 'warning' ? '#f59e0b' : '#ef4444'}
                          />
                          <div className="flex justify-between text-xs text-indigo-400 mt-1">
                            <span>0%</span>
                            <span>Confidence: {efficiency.confidence}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-indigo-400 text-sm">No data</p>
                    )}
                  </div>
                </div>

                {/* Predicted vs Actual */}
                {comparison && (
                  <div className="bg-white/8 rounded-xl p-4">
                    <p className="text-indigo-200 text-xs font-medium mb-3 flex items-center gap-1.5">
                      <i className="bi bi-graph-up-arrow text-indigo-400" /> Predicted vs Actual Output
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-indigo-300">{comparison.predicted_output}</p>
                        <p className="text-xs text-indigo-400">Predicted</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{comparison.actual_output}</p>
                        <p className="text-xs text-indigo-400">Actual</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${comparison.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {comparison.variance >= 0 ? '+' : ''}{comparison.variance}
                        </p>
                        <p className="text-xs text-indigo-400">
                          {comparison.variance_pct >= 0 ? '+' : ''}{comparison.variance_pct}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions & Alerts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.length > 0 && (
                    <div className="bg-white/8 rounded-xl p-4">
                      <p className="text-indigo-200 text-xs font-medium mb-2 flex items-center gap-1.5">
                        <i className="bi bi-lightbulb text-amber-400" /> AI Suggestions
                      </p>
                      <div className="space-y-2">
                        {suggestions.map(s => <SuggestionMini key={s.id} s={s} />)}
                      </div>
                    </div>
                  )}

                  {alerts.length > 0 && (
                    <div className="bg-white/8 rounded-xl p-4">
                      <p className="text-indigo-200 text-xs font-medium mb-2 flex items-center gap-1.5">
                        <i className="bi bi-bell text-red-400" /> Active Alerts
                      </p>
                      <div className="space-y-2">
                        {alerts.map(a => <AlertMini key={a.id} a={a} />)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="/ai/dashboard"
                    className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <i className="bi bi-bar-chart" /> AI Dashboard
                  </a>
                  <span className="text-indigo-600">·</span>
                  <a
                    href="/ai/suggestions"
                    className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <i className="bi bi-lightbulb" /> All Suggestions
                  </a>
                  <span className="text-indigo-600">·</span>
                  <a
                    href="/ai/alerts"
                    className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <i className="bi bi-bell" /> All Alerts
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
