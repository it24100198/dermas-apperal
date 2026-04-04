import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listJobs } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function JobsList() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => listJobs().then((r) => r.data),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">All Jobs</h1>
        <Link to="/jobs/create" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Create Job</Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3">Job #</th>
              <th className="px-4 py-3">Style / Batch</th>
              <th className="px-4 py-3">Fabric issued</th>
              <th className="px-4 py-3">Cut pieces</th>
              <th className="px-4 py-3">Produced</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(jobs || []).map((job) => (
              <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{job.jobNumber}</td>
                <td className="px-4 py-3">{job.styleRef || '—'} / {job.batchRef || '—'}</td>
                <td className="px-4 py-3">{job.issuedFabricQuantity}</td>
                <td className="px-4 py-3">{job.totalCutPieces ?? '—'}</td>
                <td className="px-4 py-3">{job.producedQty ?? 0}</td>
                <td className="px-4 py-3">{job.remainingQty == null ? '—' : job.remainingQty}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3">{job.productId?.name || '—'}</td>
                <td className="px-4 py-3">
                  <Link to={`/jobs/${job._id}`} className="text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!jobs || jobs.length === 0) && (
          <p className="px-4 py-8 text-slate-500 text-center">No jobs. Create one from Material issue.</p>
        )}
      </div>
    </div>
  );
}
