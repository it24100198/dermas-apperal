import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWashing,
  createWashingTransfer,
  receiveWashingTransfer,
  completeWashingTransfer,
  listJobs,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';

const TABS = [
  { key: 'incomingPending', label: 'Incoming (Pending)' },
  { key: 'inProgressReceived', label: 'In Progress (Received)' },
  { key: 'completedWashing', label: 'Completed (Washing)' },
  { key: 'returned', label: 'Returned' },
];

export default function Washing() {
  const [tab, setTab] = useState('incomingPending');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ jobId: '', quantitySent: '', sentFrom: '' });
  const queryClient = useQueryClient();

  const { data: washingData, isLoading } = useQuery({
    queryKey: ['washing'],
    queryFn: () => getWashing().then((r) => r.data),
  });
  const { data: jobsList } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: () => listJobs().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body) => createWashingTransfer(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowCreate(false);
      setCreateForm({ jobId: '', quantitySent: '', sentFrom: '' });
    },
  });
  const receiveMutation = useMutation({
    mutationFn: (id) => receiveWashingTransfer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['washing'] }),
  });
  const completeMutation = useMutation({
    mutationFn: (id) => completeWashingTransfer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['washing'] }),
  });

  const transfers = washingData?.[tab] || [];
  const isWashingSupervisor = true; // TODO: from auth/employee role

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({
      jobId: createForm.jobId || undefined,
      quantitySent: Number(createForm.quantitySent),
      sentFrom: createForm.sentFrom || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Washing Gate Pass</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          Create Transfer
        </button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Washing Transfer</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Job (optional)</label>
                <select
                  value={createForm.jobId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, jobId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">— Standalone —</option>
                  {(jobsList || []).map((j) => (
                    <option key={j._id} value={j._id}>{j.jobNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Quantity sent *</label>
                <input
                  type="number"
                  min="1"
                  value={createForm.quantitySent}
                  onChange={(e) => setCreateForm((f) => ({ ...f, quantitySent: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Sent from</label>
                <input
                  type="text"
                  value={createForm.sentFrom}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sentFrom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-slate-800 text-white rounded-lg">
                  Create
                </button>
              </div>
            </form>
            {createMutation.isError && (
              <p className="mt-2 text-red-600 text-sm">{createMutation.error.response?.data?.error}</p>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2 border-b border-slate-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg font-medium ${
              tab === t.key ? 'bg-white border border-b-0 border-slate-200 text-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Qty sent</th>
                <th className="px-4 py-3">Sent from</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{t.jobId?.jobNumber || '—'}</td>
                  <td className="px-4 py-3">{t.quantitySent}</td>
                  <td className="px-4 py-3">{t.sentFrom || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    {t.status === 'pending' && isWashingSupervisor && (
                      <button
                        onClick={() => receiveMutation.mutate(t._id)}
                        disabled={receiveMutation.isPending}
                        className="text-blue-600 hover:underline mr-2"
                      >
                        Receive
                      </button>
                    )}
                    {t.status === 'received' && isWashingSupervisor && (
                      <button
                        onClick={() => completeMutation.mutate(t._id)}
                        disabled={completeMutation.isPending}
                        className="text-green-600 hover:underline"
                      >
                        Complete washing
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && (
            <p className="px-4 py-8 text-slate-500 text-center">No transfers in this tab</p>
          )}
        </div>
      )}
    </div>
  );
}
