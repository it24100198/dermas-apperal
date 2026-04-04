import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listQc } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function QcList() {
  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['qc-list'],
    queryFn: () => listQc().then((r) => r.data),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">QC / Final Checking</h1>
        <Link to="/manufacturing/final" className="text-blue-600 hover:underline">→ Final Checking (batch finalize)</Link>
      </div>
      <p className="text-slate-500 mb-4">Transfers with washing_completed. Open to enter QC and manage batches.</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Qty sent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(transfers || []).map((t) => (
              <tr key={t._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">{t.jobId?.jobNumber || '—'}</td>
                <td className="px-4 py-3">{t.quantitySent}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  <Link to={`/manufacturing/qc/${t._id}`} className="text-blue-600 hover:underline">Open QC</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!transfers || transfers.length === 0) && (
          <p className="px-4 py-8 text-slate-500 text-center">No transfers ready for QC</p>
        )}
      </div>
    </div>
  );
}
