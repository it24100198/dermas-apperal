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
  const goodN = Number(goodQty) || 0;
  const dmgN = Number(damageQty) || 0;
  const sum = goodN + dmgN;
  const validQc = sum === totalRequired && totalRequired > 0;
  const remainder = totalRequired - sum;
  const pct = totalRequired > 0 ? Math.min(100, Math.round((sum / totalRequired) * 100)) : 0;

  if (isLoading || !data) return (
    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
  );
  if (error) return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      {error.response?.data?.error || error.message}
    </div>
  );

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

  const printBatchBarcode = (batch) => {
    const code = batch?.batchCode || `BATCH-${batch?._id || ''}`;
    const jobNum = data?.job?.jobNumber || '-';
    const batchType = batch?.type ? batch.type.charAt(0).toUpperCase() + batch.type.slice(1) : '-';
    const qty = batch?.quantity ?? 0;
    const w = window.open('', '_blank', 'width=560,height=680');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Batch Label – ${code}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .label {
      width: 400px;
      border: 1.5px solid #222;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.10);
    }
    .label-header {
      background: #111;
      color: #fff;
      text-align: center;
      padding: 10px 16px 8px;
    }
    .label-header .company { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .label-header .subtitle { font-size: 10px; color: #aaa; letter-spacing: 1px; margin-top: 2px; }
    .label-body { padding: 14px 20px 10px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .meta-item { }
    .meta-item .label-key { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .meta-item .label-val { font-size: 14px; font-weight: 700; color: #111; margin-top: 1px; }
    .divider { border: none; border-top: 1px dashed #ddd; margin: 10px 0; }
    .barcode-wrap { text-align: center; padding: 4px 0 6px; }
    .barcode-wrap svg { max-width: 100%; }
    .code-text { text-align: center; font-family: monospace; font-size: 11px; color: #555; margin-top: 4px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="label">
    <div class="label-header">
      <div class="company">Dermas Apparel</div>
      <div class="subtitle">QC Packing Batch Label</div>
    </div>
    <div class="label-body">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="label-key">Job</div>
          <div class="label-val">${jobNum}</div>
        </div>
        <div class="meta-item">
          <div class="label-key">Type</div>
          <div class="label-val">${batchType}</div>
        </div>
        <div class="meta-item">
          <div class="label-key">Quantity</div>
          <div class="label-val">${qty} pcs</div>
        </div>
        <div class="meta-item">
          <div class="label-key">Batch Code</div>
          <div class="label-val" style="font-size:11px;word-break:break-all;">${code}</div>
        </div>
      </div>
      <hr class="divider"/>
      <div class="barcode-wrap">
        <svg id="barcode"></svg>
      </div>
      <div class="code-text">${code}</div>
    </div>
  </div>
  <script>
    window.onload = function() {
      JsBarcode('#barcode', '${code}', {
        format: 'CODE128',
        lineColor: '#000',
        width: 2,
        height: 60,
        displayValue: false,
        margin: 6
      });
      setTimeout(() => window.print(), 400);
    };
  <\/script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/manufacturing/qc')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to QC
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quality Control</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {data?.job?.jobNumber ? `Job ${data.job.jobNumber}` : '—'}
                {' · '}Transfer of <span className="font-semibold text-slate-700">{transfer?.quantitySent} pcs</span>
              </p>
            </div>
            {qcCheck && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                QC Completed
              </span>
            )}
          </div>
        </div>

        {!qcCheck ? (
          /* ── QC Entry Form ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <h2 className="font-semibold text-slate-800 text-base">Enter QC Results</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Finished Good + Damaged must equal <strong className="text-slate-700">{totalRequired} pcs</strong>
              </p>
            </div>

            <div className="px-6 py-6 space-y-6">

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Quantity allocated</span>
                  <span className={validQc ? 'text-emerald-600 font-semibold' : sum > totalRequired ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                    {sum} / {totalRequired} pcs
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      validQc ? 'bg-emerald-500' : sum > totalRequired ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!validQc && totalRequired > 0 && (
                  <div className={`mt-2 text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${
                    sum > totalRequired
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {sum > totalRequired
                      ? `Total exceeds transfer by ${sum - totalRequired} pcs — reduce Good or Damaged.`
                      : `${remainder} pcs unallocated — add to Good or Damaged to enable Save.`
                    }
                  </div>
                )}
                {validQc && (
                  <div className="mt-2 text-xs rounded-lg px-3 py-2 flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    All {totalRequired} pcs allocated — ready to save.
                  </div>
                )}
              </div>

              {/* Quick fill buttons */}
              {remainder > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setGoodQty(String(goodN + remainder))}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add {remainder} to Good
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamageQty(String(dmgN + remainder))}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add {remainder} to Damaged
                  </button>
                </div>
              )}

              {/* Qty inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Finished Good Qty
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={goodQty}
                      onChange={(e) => setGoodQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">pcs</span>
                  </div>
                  {goodN > 0 && (
                    <p className="mt-1 text-xs text-emerald-600">
                      {Math.round((goodN / totalRequired) * 100)}% of transfer
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Damaged Qty
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={damageQty}
                      onChange={(e) => setDamageQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">pcs</span>
                  </div>
                  {dmgN > 0 && (
                    <p className="mt-1 text-xs text-orange-600">
                      {Math.round((dmgN / totalRequired) * 100)}% of transfer
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any QC notes here…"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Save */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => saveQcMutation.mutate()}
                  disabled={!validQc || saveQcMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saveQcMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save QC
                    </>
                  )}
                </button>
                {saveQcMutation.isError && (
                  <p className="text-red-600 text-sm">{saveQcMutation.error.response?.data?.error}</p>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* ── QC Results + Batches ── */
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <p className="text-xs text-slate-500 mb-1">Transfer Qty</p>
                <p className="text-2xl font-bold text-slate-800">{totalRequired}</p>
                <p className="text-xs text-slate-400">pcs received</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 px-5 py-4">
                <p className="text-xs text-emerald-600 mb-1">Finished Good</p>
                <p className="text-2xl font-bold text-emerald-700">{qcCheck.finishedGoodQty}</p>
                <p className="text-xs text-slate-400">{totalRequired > 0 ? Math.round((qcCheck.finishedGoodQty / totalRequired) * 100) : 0}% of transfer</p>
              </div>
              <div className="bg-white rounded-xl border border-orange-200 px-5 py-4">
                <p className="text-xs text-orange-600 mb-1">Damaged</p>
                <p className="text-2xl font-bold text-orange-600">{qcCheck.damagedQty}</p>
                <p className="text-xs text-slate-400">{totalRequired > 0 ? Math.round((qcCheck.damagedQty / totalRequired) * 100) : 0}% of transfer</p>
              </div>
            </div>

            {/* Packing batches */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 text-base">Packing Batches</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{packingBatches.length} batch{packingBatches.length !== 1 ? 'es' : ''} created</p>
                </div>
              </div>
              {packingBatches.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">No batches found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {packingBatches.map((b) => (
                    <div key={b._id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {b.batchCode || '—'}
                          </span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-sm text-slate-700 capitalize">{b.type} &mdash; <span className="font-semibold">{b.quantity} pcs</span></p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => printBatchBarcode(b)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Barcode
                        </button>
                        {b.status === 'packing' && (
                          <>
                            <button
                              onClick={() => setAccessoryModal(b)}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Accessory
                            </button>
                            <button
                              onClick={() => sendToFinalMutation.mutate(b._id)}
                              disabled={sendToFinalMutation.isPending}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              Send to Final Checking
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Accessory modal */}
      {accessoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Issue Accessory to Batch</h2>
              <p className="text-slate-500 text-sm mt-0.5 font-mono">{accessoryModal.batchCode || accessoryModal._id}</p>
            </div>
            <form onSubmit={handleIssueAccessory} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Material</label>
                <select
                  value={accessoryForm.materialId}
                  onChange={(e) => setAccessoryForm((f) => ({ ...f, materialId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select material…</option>
                  {(materials || []).filter((m) => m.type === 'accessory').map((m) => (
                    <option key={m._id} value={m._id}>{m.name} (stock: {m.stockQty})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={accessoryForm.quantityIssued}
                  onChange={(e) => setAccessoryForm((f) => ({ ...f, quantityIssued: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {issueAccessoryMutation.isError && (
                <p className="text-red-600 text-sm">{issueAccessoryMutation.error.response?.data?.error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAccessoryModal(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueAccessoryMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {issueAccessoryMutation.isPending ? 'Issuing…' : 'Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
