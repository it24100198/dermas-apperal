import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinalJobDetail, finalizeBatch } from '../api/client';
import StatusBadge from '../components/StatusBadge';

function fmt(n) {
  return Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinalDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmBatch, setConfirmBatch] = useState(null);

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
      setConfirmBatch(null);
    },
  });

  if (isLoading || !data) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
  );
  if (error) return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      {error.response?.data?.error || error.message}
    </div>
  );

  const { job, batches, costSummary } = data;
  const pendingBatches = (batches || []).filter((b) => b.status === 'sent_to_final_check');
  const completedBatches = (batches || []).filter((b) => b.status === 'completed');
  const allDone = pendingBatches.length === 0 && completedBatches.length > 0;

  const cs = costSummary || {};
  const breakdown = cs.materialBreakdown || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/manufacturing/final')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Final Checking
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Final Check — {job?.jobNumber}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Product: <span className="font-medium text-slate-700">{job?.productId?.name || '—'}</span>
                {job?.productId?.sku && <span className="ml-1 text-xs text-slate-400">({job.productId.sku})</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={job?.status} />
              {allDone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All Batches Finalized
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cost Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500 mb-1">Total Material Cost</p>
            <p className="text-xl font-bold text-slate-800">LKR {fmt(cs.totalMaterialCost)}</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 px-5 py-4">
            <p className="text-xs text-emerald-600 mb-1">Good Pcs Produced</p>
            <p className="text-xl font-bold text-emerald-700">{(cs.totalGoodPcs || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 px-5 py-4">
            <p className="text-xs text-blue-600 mb-1">Cost / Good Piece</p>
            <p className="text-xl font-bold text-blue-700">LKR {fmt(cs.costPerPieceGood)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500 mb-1">Cost / All Pieces</p>
            <p className="text-xl font-bold text-slate-700">LKR {fmt(cs.costPerPieceAll)}</p>
          </div>
        </div>

        {/* Material Cost Breakdown */}
        {breakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h2 className="font-semibold text-slate-800 text-base">Material Cost Breakdown</h2>
              <p className="text-slate-500 text-sm mt-0.5">Materials issued to this job and their total cost</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-left text-xs uppercase tracking-wide">
                  <th className="px-6 py-3">Material</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Qty Issued</th>
                  <th className="px-6 py-3 text-right">Total Cost</th>
                  <th className="px-6 py-3 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((m) => (
                  <tr key={m.materialId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      LKR {fmt(m.unitPrice)}<span className="text-slate-400 text-xs ml-0.5">/{m.unit}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{m.qtyIssued.toLocaleString()} {m.unit}</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">LKR {fmt(m.totalCost)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs text-slate-500">
                        {cs.totalMaterialCost > 0
                          ? Math.round((m.totalCost / cs.totalMaterialCost) * 100) + '%'
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-6 py-3 font-bold text-slate-800" colSpan={3}>Total</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-900">LKR {fmt(cs.totalMaterialCost)}</td>
                  <td className="px-6 py-3 text-right text-slate-400 text-xs">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {breakdown.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-sm text-amber-800">
            No material issues recorded for this job — cost per piece cannot be calculated.
          </div>
        )}

        {/* Packing Batches */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 text-base">Packing Batches</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                {pendingBatches.length} pending · {completedBatches.length} finalized
              </p>
            </div>
          </div>

          {batches?.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">No batches found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(batches || []).map((b) => {
                const isPending = b.status === 'sent_to_final_check';
                return (
                  <div key={b._id} className={`px-6 py-4 flex items-center gap-4 ${isPending ? '' : 'opacity-70'}`}>
                    <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${isPending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {b.batchCode || '—'}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-slate-700 capitalize">
                        {b.type} batch — <span className="font-semibold">{b.quantity} pcs</span>
                      </p>
                      {cs.costPerPieceGood > 0 && b.type === 'good' && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Est. value: LKR {fmt(b.quantity * cs.costPerPieceGood)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isPending ? (
                        <button
                          onClick={() => setConfirmBatch(b)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Finalize &amp; Send to Stock
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Added to Stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {finalizeMutation.isError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {finalizeMutation.error.response?.data?.error || finalizeMutation.error.message}
          </div>
        )}
      </div>

      {/* Confirm Finalize Modal */}
      {confirmBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Finalize Batch</h3>
                  <p className="text-sm text-slate-500">This will add pieces to product stock.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Code</span>
                  <span className="font-mono font-medium text-slate-800">{confirmBatch.batchCode || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="capitalize font-medium text-slate-800">{confirmBatch.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-slate-800">{confirmBatch.quantity} pcs</span>
                </div>
                {confirmBatch.type === 'good' && cs.costPerPieceGood > 0 && (
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500">Est. Stock Value</span>
                    <span className="font-bold text-emerald-700">LKR {fmt(confirmBatch.quantity * cs.costPerPieceGood)}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-3">
                {confirmBatch.type === 'good'
                  ? `${confirmBatch.quantity} pcs will be added to "${job?.productId?.name}" product stock.`
                  : `${confirmBatch.quantity} pcs will be added to the Damage stock.`
                }
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setConfirmBatch(null)}
                disabled={finalizeMutation.isPending}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => finalizeMutation.mutate(confirmBatch._id)}
                disabled={finalizeMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {finalizeMutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Finalizing…
                  </>
                ) : 'Confirm & Send to Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
