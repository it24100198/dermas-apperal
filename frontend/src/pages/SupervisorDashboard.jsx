import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupervisorDashboard, completeLine } from '../api/client';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

export default function SupervisorDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['supervisor-dashboard'],
    queryFn: () => getSupervisorDashboard().then((r) => r.data),
  });
  const completeMutation = useMutation({
    mutationFn: (jobId) => completeLine(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard'] }),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  const { section, jobs, canCompleteLine, isWashingSupervisor } = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Supervisor dashboard</h1>
      <p className="text-slate-500 mb-4">
        Section: {section?.name || '—'} {canCompleteLine && '(Line supervisor)'} {isWashingSupervisor && '(Washing supervisor)'}
      </p>
      {canCompleteLine && (jobs || []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="px-4 py-3 border-b font-semibold">Jobs on your line</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hourly</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${job._id}`} className="text-blue-600 hover:underline">{job.jobNumber}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/supervisor/hourly?jobId=${job._id}`}
                      className="text-amber-700 hover:underline"
                    >
                      Hourly output
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => completeMutation.mutate(job._id)}
                      disabled={completeMutation.isPending}
                      className="text-green-600 hover:underline"
                    >
                      Mark line complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(!jobs || jobs.length === 0) && (
        <p className="text-slate-500">No jobs assigned to your line, or you are not a line supervisor.</p>
      )}
    </div>
  );
}
