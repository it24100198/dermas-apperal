import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAIAlerts } from '../../api/ai';
import { api } from '../../api/client';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    icon: 'text-red-500',
    dot: 'bg-red-500',
    title: 'text-red-800',
    bar: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: 'text-amber-500',
    dot: 'bg-amber-500',
    title: 'text-amber-800',
    bar: 'bg-amber-500',
  },
  info: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    icon: 'text-emerald-500',
    dot: 'bg-emerald-500',
    title: 'text-emerald-800',
    bar: 'bg-emerald-500',
  },
};

function AlertCard({ alert, onAck }) {
  const c = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning;
  const time = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 ${alert.acknowledged ? 'opacity-60' : ''} transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
            <i className={`bi ${alert.icon} text-xl ${c.icon}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${c.title}`}>{alert.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot} mr-1`} />
                {alert.severity.toUpperCase()}
              </span>
              {alert.line && (
                <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {alert.line}
                </span>
              )}
              <span className="text-xs text-slate-400">{time}</span>
            </div>
          </div>
        </div>
        {alert.acknowledged && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <i className="bi bi-check-circle-fill text-emerald-500" /> Acknowledged
          </span>
        )}
      </div>

      <p className="text-sm text-slate-700 mb-4">{alert.message}</p>

      {/* Threshold progress */}
      {alert.value && alert.threshold && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Current Value</span>
            <span>Threshold: {alert.threshold}</span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-2 rounded-full transition-all ${c.bar}`}
              style={{ width: `${Math.min(100, (alert.value / (alert.threshold * 1.5)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={`font-bold ${c.title}`}>{alert.value}</span>
            <span className="text-slate-400">limit: {alert.threshold}</span>
          </div>
        </div>
      )}

      {!alert.acknowledged && (
        <button
          onClick={() => onAck(alert.id)}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
        >
          <i className="bi bi-check2 mr-1" /> Acknowledge
        </button>
      )}
    </div>
  );
}

export default function AlertsRecommendations() {
  const [acknowledged, setAcknowledged] = useState(new Set());
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: () => getAIAlerts().then(r => r.data),
    refetchInterval: 30000,
  });

  const alerts = (data?.alerts || []).map(a => ({
    ...a,
    acknowledged: a.acknowledged || acknowledged.has(a.id),
  }));

  const handleAck = async (alertId) => {
    try {
      await api.post(`/ai/alerts/${alertId}/acknowledge`);
    } catch {
      // offline fallback
    }
    setAcknowledged(prev => new Set([...prev, alertId]));
  };

  const active = alerts.filter(a => !a.acknowledged);
  const done = alerts.filter(a => a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-bell text-red-500" />
            Alerts & Recommendations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time production alerts — automatically triggered by AI threshold monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {active.length > 0 && (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-bold">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {active.length} Active Alert{active.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-200">
          <i className="bi bi-shield-check text-5xl text-emerald-500" />
          <p className="font-semibold text-emerald-700 mt-3">No active alerts</p>
          <p className="text-sm text-emerald-600">All production lines are within normal parameters.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Active Alerts ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(a => (
                  <AlertCard key={a.id} alert={a} onAck={handleAck} />
                ))}
              </div>
            </>
          )}

          {done.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-500 flex items-center gap-2 mt-6">
                <i className="bi bi-check-circle text-emerald-500" />
                Acknowledged ({done.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {done.map(a => (
                  <AlertCard key={a.id} alert={a} onAck={handleAck} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Alert thresholds info */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <i className="bi bi-sliders text-indigo-500" /> AI Alert Thresholds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { metric: 'Line Efficiency', threshold: '< 70%', severity: 'Critical', color: 'red' },
            { metric: 'QC Rejection Rate', threshold: '> 5%', severity: 'Warning', color: 'amber' },
            { metric: 'Fabric Wastage', threshold: '> 8%', severity: 'Warning', color: 'amber' },
            { metric: 'Production Output', threshold: '< 80% of target', severity: 'Critical', color: 'red' },
            { metric: 'Worker Absenteeism', threshold: '> 15%', severity: 'Warning', color: 'amber' },
            { metric: 'Daily Target Met', threshold: '> 100%', severity: 'Info', color: 'emerald' },
          ].map(item => (
            <div key={item.metric} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">{item.metric}</span>
              <div className="text-right">
                <span className={`text-xs font-bold text-${item.color}-600 block`}>{item.threshold}</span>
                <span className="text-xs text-slate-400">{item.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
