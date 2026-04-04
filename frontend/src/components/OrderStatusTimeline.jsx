const STATUS_STAGES = [
    { key: 'confirmed', label: 'Order Confirmed', icon: 'bi-check-circle', pct: 5 },
    { key: 'in_production', label: 'In Production', icon: 'bi-gear-wide-connected', pct: 20 },
    { key: 'cutting', label: 'Cutting', icon: 'bi-scissors', pct: 40 },
    { key: 'washing', label: 'Washing', icon: 'bi-droplet', pct: 55 },
    { key: 'qc', label: 'QC / Final Check', icon: 'bi-clipboard-check', pct: 70 },
    { key: 'packing', label: 'Packing', icon: 'bi-box-seam', pct: 85 },
    { key: 'delivered', label: 'Delivered', icon: 'bi-truck', pct: 100 },
];

function fmt(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function OrderStatusTimeline({ statusHistory = [], currentStatus }) {
    // Build a map of status → last history entry
    const histMap = {};
    statusHistory.forEach((h) => { histMap[h.status] = h; });

    const activeIdx = STATUS_STAGES.findIndex((s) => s.key === currentStatus);

    return (
        <ol className="relative ml-2">
            {STATUS_STAGES.map((stage, idx) => {
                const done = idx < activeIdx;
                const active = idx === activeIdx;
                const future = idx > activeIdx;
                const hist = histMap[stage.key];

                let dotCls = 'bg-slate-200 border-slate-300';
                let labelCls = 'text-slate-400';
                if (done) { dotCls = 'bg-emerald-500 border-emerald-500'; labelCls = 'text-slate-600'; }
                if (active) { dotCls = 'bg-blue-500 border-blue-500 ring-4 ring-blue-100'; labelCls = 'text-blue-700 font-semibold'; }

                return (
                    <li key={stage.key} className="flex gap-4 pb-6 last:pb-0 relative">
                        {/* Vertical line */}
                        {idx < STATUS_STAGES.length - 1 && (
                            <span
                                className={`absolute left-4 top-8 bottom-0 w-0.5 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`}
                            />
                        )}
                        {/* Dot */}
                        <span className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${dotCls}`}>
                            <i className={`bi ${stage.icon} text-sm ${done || active ? 'text-white' : 'text-slate-400'}`} />
                        </span>
                        {/* Content */}
                        <div className="pt-0.5 flex-1 min-w-0">
                            <p className={`text-sm ${labelCls}`}>{stage.label}</p>
                            {hist && (
                                <div className="mt-0.5 space-y-0.5">
                                    <p className="text-xs text-slate-400">{fmt(hist.timestamp)}</p>
                                    {hist.note && <p className="text-xs text-slate-500 italic">"{hist.note}"</p>}
                                </div>
                            )}
                            {future && !hist && <p className="text-xs text-slate-300 mt-0.5">Pending</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
