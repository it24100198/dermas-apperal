import { useQuery } from '@tanstack/react-query';
import { getAISuggestions } from '../../api/ai';

const PRIORITY_CONFIG = {
  high: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    icon: 'text-red-500',
    btn: 'bg-red-100 hover:bg-red-200 text-red-700',
  },
  medium: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    icon: 'text-amber-500',
    btn: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
  },
  low: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: 'text-emerald-500',
    btn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
  },
};

function SuggestionCard({ suggestion }) {
  const c = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.medium;
  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${c.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            <i className={`bi ${suggestion.icon} text-xl ${c.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{suggestion.title}</h3>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${c.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {suggestion.priority.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{suggestion.message}</p>
      <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${c.btn}`}>
        <i className="bi bi-arrow-right mr-1" />
        {suggestion.action}
      </button>
    </div>
  );
}

export default function SmartSuggestions() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => getAISuggestions().then(r => r.data),
  });

  const suggestions = data?.suggestions || [];
  const high = suggestions.filter(s => s.priority === 'high');
  const medium = suggestions.filter(s => s.priority === 'medium');
  const low = suggestions.filter(s => s.priority === 'low');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-lightbulb text-amber-500" />
            Smart Suggestions Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-powered recommendations to optimize production, reduce waste, and boost efficiency.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors"
        >
          <i className="bi bi-arrow-clockwise" /> Refresh AI
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-700">{high.length} Critical</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{medium.length} Warnings</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">{low.length} Informational</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-200">
          <i className="bi bi-check-circle text-5xl text-emerald-500" />
          <p className="font-semibold text-emerald-700 mt-3">All systems optimal!</p>
          <p className="text-sm text-emerald-600">No issues detected by the AI engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map(s => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}

      {/* How AI generates suggestions */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <i className="bi bi-cpu text-indigo-500" /> How Suggestions Are Generated
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { icon: 'bi-database', title: 'Real-Time Data', desc: 'Analyzes live production, QC, and efficiency data from ERP' },
            { icon: 'bi-graph-up', title: 'Rule-Based Engine', desc: 'Thresholds trigger specific recommendations (e.g., efficiency < 70%)' },
            { icon: 'bi-stars', title: 'AI Learning', desc: 'Model improves weekly as more factory data accumulates' },
          ].map(item => (
            <div key={item.icon} className="flex gap-3">
              <i className={`bi ${item.icon} text-indigo-500 text-xl shrink-0`} />
              <div>
                <p className="font-medium text-slate-700">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
