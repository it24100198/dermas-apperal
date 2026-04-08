import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listFinalJobs } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function FinalList() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['final-jobs'],
    queryFn: () => listFinalJobs().then((r) => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
  );
  if (error) return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      {error.response?.data?.error || error.message}
    </div>
  );

  const jobList = jobs || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Final Checking</h1>
          <p className="text-slate-500 text-sm mt-1">
            Inspect and approve packing batches before they enter product stock.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500 mb-1">Jobs Pending</p>
            <p className="text-2xl font-bold text-slate-800">{jobList.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 px-5 py-4">
            <p className="text-xs text-amber-600 mb-1">Pending Batches</p>
            <p className="text-2xl font-bold text-amber-700">
              {jobList.reduce((s, j) => s + (j.pendingCount || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 px-5 py-4">
            <p className="text-xs text-blue-600 mb-1">Total Pcs Awaiting</p>
            <p className="text-2xl font-bold text-blue-700">
              {jobList.reduce((s, j) => s + (j.pendingQty || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Jobs list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="font-semibold text-slate-800">Jobs in Final Checking</h2>
          </div>

          {jobList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm font-medium">No jobs awaiting final check</p>
              <p className="text-xs mt-1">Batches sent to final checking will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobList.map((job) => (
                <div key={job._id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{job.jobNumber}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-slate-500">
                      {job.productId?.name || '—'}
                      {job.productId?.sku ? <span className="ml-1 text-xs text-slate-400">· {job.productId.sku}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-right">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Batches</p>
                      <p className="font-semibold text-amber-700">{job.pendingCount ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Qty</p>
                      <p className="font-semibold text-slate-700">{(job.pendingQty ?? 0).toLocaleString()} pcs</p>
                    </div>
                    <Link
                      to={`/manufacturing/final/${job._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Open
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
