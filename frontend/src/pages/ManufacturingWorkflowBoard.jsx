import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listJobs } from '../api/client';
import { Link } from 'react-router-dom';

const STAGES = [
  { key: 'MATERIAL_ISSUED', label: 'Material Issued', color: 'bg-slate-100 border-slate-200 text-slate-700' },
  { key: 'CUTTING_COMPLETED', label: 'Cutting Completed', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'LINE_ASSIGNED', label: 'Line Assigned', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { key: 'LINE_IN_PROGRESS', label: 'Line In Progress', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { key: 'LINE_COMPLETED', label: 'Line Completed', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'SENT_TO_WASHING', label: 'Sent To Washing', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { key: 'QC_PENDING', label: 'QC Pending', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'QC_PASSED', label: 'QC Passed', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'QC_FAILED', label: 'QC Failed', color: 'bg-red-50 border-red-200 text-red-700' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
];

export default function ManufacturingWorkflowBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', 'workflow-board'],
    queryFn: () => listJobs({}).then((r) => r.data),
  });

  const jobs = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.key, []]));
    for (const job of jobs) {
      if (!map[job.status]) map[job.status] = [];
      map[job.status].push(job);
    }
    return map;
  }, [jobs]);

  if (isLoading) return <p className="text-slate-500">Loading workflow board...</p>;
  if (error) return <p className="text-red-600">{error.response?.data?.error || error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manufacturing Workflow Board</h1>
          <p className="text-slate-500 text-sm">End-to-end job visibility from material issue to final completion.</p>
        </div>
        <span className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">
          Total Jobs: <strong>{jobs.length}</strong>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const list = grouped[stage.key] || [];
          return (
            <section key={stage.key} className={`rounded-xl border p-3 ${stage.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">{stage.label}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current/20">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="text-xs opacity-70">No jobs in this stage.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-auto pr-1">
                  {list.slice(0, 8).map((job) => (
                    <Link
                      key={job._id}
                      to={`/jobs/${job._id}`}
                      className="block rounded-lg border border-current/20 bg-white/70 px-3 py-2 hover:bg-white transition-colors"
                    >
                      <p className="text-sm font-semibold">{job.jobNumber}</p>
                      <p className="text-xs opacity-75">{job.styleRef || 'No style ref'}</p>
                    </Link>
                  ))}
                  {list.length > 8 && <p className="text-xs opacity-70">+{list.length - 8} more</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
