import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listJobs } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function LineAssignment() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => listJobs().then((r) => r.data),
  });
  const cuttingCompleted = (jobs || []).filter((j) => j.status === 'CUTTING_COMPLETED');

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Line assignment</h1>
      <p className="text-slate-500 mb-4">Jobs in CUTTING_COMPLETED. Open job to assign lines (total assigned = total cut pieces).</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3">Job #</th>
              <th className="px-4 py-3">Total cut pieces</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {cuttingCompleted.map((job) => (
              <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{job.jobNumber}</td>
                <td className="px-4 py-3">{job.totalCutPieces ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3">
                  <Link to={`/jobs/${job._id}`} className="text-blue-600 hover:underline">Open & assign</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuttingCompleted.length === 0 && (
          <p className="px-4 py-8 text-slate-500 text-center">No jobs in CUTTING_COMPLETED</p>
        )}
      </div>
    </div>
  );
}
