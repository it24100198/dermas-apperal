import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCuttingJobs, saveCutting } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function Cutting() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['cutting-jobs'],
    queryFn: () => listCuttingJobs().then((r) => r.data),
  });
  const saveMutation = useMutation({
    mutationFn: ({ jobId, data }) => saveCutting(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutting-jobs'] });
      setFormData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => delete next[k]);
        return next;
      });
    },
  });

  const handleChange = (jobId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [jobId]: { ...(prev[jobId] || {}), [field]: Number(value) || 0 },
    }));
  };

  const handleSubmit = (e, jobId) => {
    e.preventDefault();
    const data = formData[jobId];
    if (!data || data.totalCutPieces == null) return;
    saveMutation.mutate({ jobId, data });
  };

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Cutting</h1>
      <p className="text-slate-500 mb-4">Jobs in SENT_TO_CUTTING. Save cutting record to move to CUTTING_COMPLETED.</p>
      <div className="space-y-6">
        {(jobs || []).map((job) => (
          <div key={job._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">{job.jobNumber}</span>
              <StatusBadge status={job.status} />
            </div>
            <form onSubmit={(e) => handleSubmit(e, job._id)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Fabric used</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData[job._id]?.fabricUsedQty ?? ''}
                  onChange={(e) => handleChange(job._id, 'fabricUsedQty', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Fabric waste</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData[job._id]?.fabricWasteQty ?? ''}
                  onChange={(e) => handleChange(job._id, 'fabricWasteQty', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Total cut pieces</label>
                <input
                  type="number"
                  min="0"
                  value={formData[job._id]?.totalCutPieces ?? ''}
                  onChange={(e) => handleChange(job._id, 'totalCutPieces', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Cutting reject qty</label>
                <input
                  type="number"
                  min="0"
                  value={formData[job._id]?.cuttingRejectQty ?? ''}
                  onChange={(e) => handleChange(job._id, 'cuttingRejectQty', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  Save &amp; move to Cutting Completed
                </button>
              </div>
            </form>
            {saveMutation.isError && saveMutation.variables?.jobId === job._id && (
              <p className="mt-2 text-red-600 text-sm">{saveMutation.error.response?.data?.error}</p>
            )}
          </div>
        ))}
      </div>
      {(!jobs || jobs.length === 0) && (
        <p className="text-slate-500">No jobs in SENT_TO_CUTTING.</p>
      )}
    </div>
  );
}
