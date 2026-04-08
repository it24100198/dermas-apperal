import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQcDetail,
  saveQc,
  issueAccessoryToBatch,
  sendBatchToFinalCheck,
  getMaterials,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function QcDetail() {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [goodQty, setGoodQty] = useState('');
  const [damageQty, setDamageQty] = useState('');
  const [notes, setNotes] = useState('');
  const [accessoryModal, setAccessoryModal] = useState(null);
  const [accessoryForm, setAccessoryForm] = useState({ materialId: '', quantityIssued: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['qc-detail', transferId],
    queryFn: () => getQcDetail(transferId).then((r) => r.data),
    enabled: !!transferId,
  });
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => getMaterials().then((r) => r.data),
  });

  const saveQcMutation = useMutation({
    mutationFn: () => saveQc(transferId, {
      finishedGoodQty: Number(goodQty),
      damagedQty: Number(damageQty),
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-detail', transferId] });
      queryClient.invalidateQueries({ queryKey: ['qc-list'] });
    },
  });
  const issueAccessoryMutation = useMutation({
    mutationFn: ({ batchId, body }) => issueAccessoryToBatch(batchId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-detail', transferId] });
      setAccessoryModal(null);
      setAccessoryForm({ materialId: '', quantityIssued: '' });
    },
  });
  const sendToFinalMutation = useMutation({
    mutationFn: (batchId) => sendBatchToFinalCheck(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-detail', transferId] });
      queryClient.invalidateQueries({ queryKey: ['qc-list'] });
    },
  });

  const transfer = data?.transfer;
  const qcCheck = data?.qcCheck;
  const packingBatches = data?.packingBatches || [];
  const totalRequired = transfer?.quantitySent ?? 0;
  const sum = (Number(goodQty) || 0) + (Number(damageQty) || 0);
  const validQc = sum === totalRequired && totalRequired > 0;

  if (isLoading || !data) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  const handleIssueAccessory = (e) => {
    e.preventDefault();
    if (!accessoryModal) return;
    issueAccessoryMutation.mutate({
      batchId: accessoryModal._id,
      body: {
        materialId: accessoryForm.materialId,
        quantityIssued: Number(accessoryForm.quantityIssued),
        issuedTo: 'Packing batch',
      },
    });
  };

  return (
    <div>
      <button onClick={() => navigate('/manufacturing/qc')} className="text-slate-600 hover:underline mb-4">← Back to QC</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">QC: Transfer {transfer?.quantitySent} pcs</h1>
      <p className="text-slate-500 mb-4">Job: {data?.job?.jobNumber || '—'}</p>

      {!qcCheck ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
          <h2 className="font-semibold mb-4">Enter QC</h2>
          <p className="text-sm text-slate-600 mb-2">Good + Damage must equal {totalRequired}</p>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Finished good qty</label>
              <input
                type="number"
                min="0"
                value={goodQty}
                onChange={(e) => setGoodQty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Damaged qty</label>
              <input
                type="number"
                min="0"
                value={damageQty}
                onChange={(e) => setDamageQty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => saveQcMutation.mutate()}
            disabled={!validQc || saveQcMutation.isPending}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
          >
            Save QC
          </button>
          {saveQcMutation.isError && (
            <p className="mt-2 text-red-600 text-sm">{saveQcMutation.error.response?.data?.error}</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-4">QC saved: Good {qcCheck.finishedGoodQty}, Damage {qcCheck.damagedQty}</p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="px-4 py-3 border-b font-semibold">Packing Batches</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packingBatches.map((b) => (
                  <tr key={b._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{b.type}</td>
                    <td className="px-4 py-3">{b.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      {b.status === 'packing' && (
                        <>
                          <button
                            onClick={() => setAccessoryModal(b)}
                            className="text-blue-600 hover:underline mr-2"
                          >
                            Add accessory
                          </button>
                          <button
                            onClick={() => sendToFinalMutation.mutate(b._id)}
                            disabled={sendToFinalMutation.isPending}
                            className="text-green-600 hover:underline"
                          >
                            Send to final check
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {accessoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-semibold mb-4">Issue accessory to batch</h2>
            <form onSubmit={handleIssueAccessory} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Material</label>
                <select
                  value={accessoryForm.materialId}
                  onChange={(e) => setAccessoryForm((f) => ({ ...f, materialId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select</option>
                  {(materials || []).filter((m) => m.type === 'accessory').map((m) => (
                    <option key={m._id} value={m._id}>{m.name} (stock: {m.stockQty})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={accessoryForm.quantityIssued}
                  onChange={(e) => setAccessoryForm((f) => ({ ...f, quantityIssued: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAccessoryModal(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={issueAccessoryMutation.isPending} className="px-4 py-2 bg-slate-800 text-white rounded-lg">Issue</button>
              </div>
            </form>
            {issueAccessoryMutation.isError && (
              <p className="mt-2 text-red-600 text-sm">{issueAccessoryMutation.error.response?.data?.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
