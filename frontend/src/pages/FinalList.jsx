import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listFinalJobs } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function FinalList() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['final-jobs'],
    queryFn: () => listFinalJobs().then((r) => r.data),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Final Checking</h1>
      <p className="text-slate-500 mb-4">Jobs with batches in sent_to_final_check. Open to finalize batches.</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3">Job #</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(jobs || []).map((job) => (
              <tr key={job._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{job.jobNumber}</td>
                <td className="px-4 py-3">{job.productId?.name || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3">
                  <Link to={`/manufacturing/final/${job._id}`} className="text-blue-600 hover:underline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!jobs || jobs.length === 0) && (
          <p className="px-4 py-8 text-slate-500 text-center">No jobs in final checking</p>
        )}
      </div>
    </div>
  );
}
