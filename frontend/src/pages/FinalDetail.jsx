import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinalJobDetail, finalizeBatch } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function FinalDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['final-detail', jobId],
    queryFn: () => getFinalJobDetail(jobId).then((r) => r.data),
    enabled: !!jobId,
  });
  const finalizeMutation = useMutation({
    mutationFn: (batchId) => finalizeBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['final-jobs'] });
    },
  });

  if (isLoading || !data) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  const { job, batches } = data;
  const pendingBatches = batches?.filter((b) => b.status === 'sent_to_final_check') || [];

  return (
    <div>
      <button onClick={() => navigate('/manufacturing/final')} className="text-slate-600 hover:underline mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Final Check: {job?.jobNumber}</h1>
      <p className="text-slate-500 mb-4">Product: {job?.productId?.name || '—'}</p>
      <StatusBadge status={job?.status} className="mb-4" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b font-semibold">Batches</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(batches || []).map((b) => (
              <tr key={b._id} className="border-t border-slate-100">
                <td className="px-4 py-3">{b.type}</td>
                <td className="px-4 py-3">{b.quantity}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3">
                  {b.status === 'sent_to_final_check' && (
                    <button
                      onClick={() => finalizeMutation.mutate(b._id)}
                      disabled={finalizeMutation.isPending}
                      className="text-green-600 hover:underline"
                    >
                      Finalize
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {finalizeMutation.isError && (
        <p className="mt-2 text-red-600 text-sm">{finalizeMutation.error.response?.data?.error}</p>
      )}
    </div>
  );
}
