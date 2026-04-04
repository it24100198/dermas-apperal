import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const CUTTING_DONE_STATUS = 'CUTTING_COMPLETED';
// All statuses where remaining cut pieces may still need hourly production records
const ACTIVE_LINE_STATUSES = [
  'LINE_ASSIGNED',
  'LINE_IN_PROGRESS',
  'LINE_COMPLETED',
  'WASHING_OUT',
  'AFTER_WASH_RECEIVED',
  'PACKING_COMPLETED',
];

export default function LineAssignment() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => listJobs().then((r) => r.data),
  });

  const cuttingCompleted = (jobs || []).filter((j) => j.status === CUTTING_DONE_STATUS);
  // Show all active-stage jobs; for post-line-assigned stages only show if remaining > 0
  const lineJobs = (jobs || []).filter((j) => {
    if (!ACTIVE_LINE_STATUSES.includes(j.status)) return false;
    if (['LINE_ASSIGNED', 'LINE_IN_PROGRESS'].includes(j.status)) return true;
    // For later stages, only show if still has remaining pieces to produce
    return j.remainingQty == null || j.remainingQty > 0;
  });

  if (isLoading) return <div className="text-slate-500 p-6">Loading...</div>;
  if (error) return <div className="text-red-600 p-6">{error.response?.data?.error || error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Line Assignment & Production</h1>
        <p className="text-slate-500 text-sm mt-1">
          Assign lines to cutting-completed jobs. Then track hourly production per line.
        </p>
        <p className="text-slate-600 text-sm mt-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2">
          <strong>Product recipe:</strong> on the job’s <strong>Assign lines</strong> screen, after you choose the finished product, use{' '}
          <strong>Add recipe</strong> / <strong>Edit recipe</strong> so materials per piece are set before production (same as Manufacturing → Product recipe).
        </p>
      </div>

      {/* Jobs awaiting line assignment */}
      {cuttingCompleted.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <h2 className="font-semibold text-amber-800 flex items-center gap-2 text-sm">
              <i className="bi bi-scissors" /> Cutting Completed — Awaiting Line Assignment ({cuttingCompleted.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job #</th>
                <th className="px-4 py-3">Style / Batch</th>
                <th className="px-4 py-3">Total Cut Pcs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {cuttingCompleted.map((job) => (
                <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{job.jobNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{job.styleRef || '—'} / {job.batchRef || '—'}</td>
                  <td className="px-4 py-3 font-medium">{job.totalCutPieces ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <i className="bi bi-people" /> Assign Lines
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Jobs in line production (including LINE_COMPLETED / WASHING_OUT with remaining qty) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <i className="bi bi-bar-chart-line" /> Line Production Jobs ({lineJobs.length})
          </h2>
        </div>
        {lineJobs.length === 0 ? (
          <p className="px-4 py-8 text-slate-500 text-center text-sm">No jobs currently in line production.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job #</th>
                <th className="px-4 py-3">Style / Batch</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Cut Pcs</th>
                <th className="px-4 py-3">Produced</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lineJobs.map((job) => {
                const remaining = job.remainingQty;
                const produced = job.producedQty ?? 0;
                const cut = job.totalCutPieces;
                const pct = cut > 0 ? Math.min(100, Math.round((produced / cut) * 100)) : 0;
                return (
                  <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{job.jobNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{job.styleRef || '—'} / {job.batchRef || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{job.productId?.name || '—'}</td>
                    <td className="px-4 py-3">{cut ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-indigo-700">{produced}</span>
                      {cut > 0 && (
                        <div className="mt-1 w-20 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {remaining == null ? (
                        <span className="text-slate-400">—</span>
                      ) : remaining === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <i className="bi bi-check-circle-fill" /> Done
                        </span>
                      ) : (
                        <span className="font-medium text-amber-700">{remaining}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/production/hourly?jobId=${job._id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <i className="bi bi-clock" /> Hourly Report
                        </button>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          <i className="bi bi-box-arrow-up-right" /> Job Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
