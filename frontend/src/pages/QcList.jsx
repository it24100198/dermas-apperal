import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listQc } from '../api/client';

export default function QcList() {
  const navigate = useNavigate();
  const { data: qcJobs, isLoading, error } = useQuery({
    queryKey: ['qc-list'],
    queryFn: () => listQc().then((r) => r.data),
  });

  if (isLoading) return <div className="text-slate-500 p-6">Loading...</div>;
  if (error) return <div className="text-red-600 p-6">{error.response?.data?.error || error.message}</div>;

  const pending = (qcJobs || []).filter((j) => !j.allQcDone);
  const done = (qcJobs || []).filter((j) => j.allQcDone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">QC Checking</h1>
          <p className="text-slate-500 text-sm mt-1">
            Jobs with washing completed. Enter QC results per transfer.
          </p>
        </div>
        <Link to="/manufacturing/final" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
          <i className="bi bi-patch-check" /> Final Checking →
        </Link>
      </div>

      {/* Pending QC */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <i className="bi bi-exclamation-circle text-amber-600" />
            <h2 className="font-semibold text-amber-800 text-sm">Pending QC ({pending.length} job{pending.length !== 1 ? 's' : ''})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Transfers</th>
                <th className="px-4 py-3">Total Qty</th>
                <th className="px-4 py-3">QC Progress</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((g) => (
                <tr key={g.jobId || 'standalone'} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{g.job?.jobNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {g.transferCount} transfer{g.transferCount !== 1 ? 's' : ''}
                    <div className="text-xs text-slate-400 mt-0.5">
                      {g.transfers.map((t) => `${t.quantitySent}`).join(' + ')} pcs
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-indigo-700">{g.totalQty}</span>
                    <span className="text-slate-400 text-xs ml-1">pcs total</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-amber-500 transition-all"
                          style={{ width: `${Math.round((g.qcDoneCount / g.transferCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{g.qcDoneCount}/{g.transferCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/manufacturing/qc/job/${g.jobId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <i className="bi bi-clipboard-check" /> Enter QC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Completed QC */}
      {done.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
            <i className="bi bi-check-circle text-emerald-600" />
            <h2 className="font-semibold text-emerald-800 text-sm">QC Completed ({done.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Transfers</th>
                <th className="px-4 py-3">Total Qty</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {done.map((g) => (
                <tr key={g.jobId || 'standalone'} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{g.job?.jobNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{g.transferCount} transfer{g.transferCount !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{g.totalQty} pcs</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/manufacturing/qc/job/${g.jobId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      <i className="bi bi-eye" /> View Batches
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!qcJobs || qcJobs.length === 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <i className="bi bi-clipboard-x text-4xl text-slate-300 block mb-3" />
          <p className="text-slate-500">No transfers ready for QC</p>
          <p className="text-slate-400 text-sm mt-1">Complete washing to move transfers here</p>
        </div>
      )}
    </div>
  );
}
