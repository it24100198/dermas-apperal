import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJob,
  sendJobToCutting,
  getAssignLinesMeta,
  assignLines,
  createWashingTransfer,
  getRecipeForProduct,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';
import JobAIPanel from '../components/JobAIPanel';
import RecipeEditorModal from '../components/RecipeEditorModal';

const CAN_SEND_CUTTING = 'FABRIC_ISSUED';
const CAN_ASSIGN_LINES = 'CUTTING_COMPLETED';

const STEPS = [
  { key: 1, label: 'Fabric Issue', status: 'FABRIC_ISSUED' },
  { key: 2, label: 'Sent to Cutting', status: 'SENT_TO_CUTTING' },
  { key: 3, label: 'Cutting Done', status: 'CUTTING_COMPLETED' },
  { key: 4, label: 'Line Prod.', status: 'LINE_ASSIGNED' },
  { key: 5, label: 'Washing', status: 'WASHING_OUT' },
  { key: 6, label: 'Packing', status: 'PACKING_COMPLETED' },
  { key: 7, label: 'Finished', status: 'WAREHOUSE_RECEIVED' },
];

const statusOrder = [
  'FABRIC_ISSUED', 'SENT_TO_CUTTING', 'CUTTING_COMPLETED', 'LINE_ASSIGNED', 'LINE_IN_PROGRESS',
  'LINE_COMPLETED', 'WASHING_OUT', 'AFTER_WASH_RECEIVED', 'PACKING_COMPLETED', 'WAREHOUSE_RECEIVED',
];

function getCurrentStep(status) {
  const idx = statusOrder.indexOf(status);
  if (idx <= 1) return 2; // after fabric -> send to cutting / cutting
  if (status === 'SENT_TO_CUTTING') return 3;
  if (status === 'CUTTING_COMPLETED') return 4;
  if (['LINE_ASSIGNED', 'LINE_IN_PROGRESS'].includes(status)) return 5;
  if (status === 'LINE_COMPLETED') return 5;
  if (status === 'WASHING_OUT' || status === 'AFTER_WASH_RECEIVED') return 6;
  if (status === 'PACKING_COMPLETED') return 7;
  if (status === 'WAREHOUSE_RECEIVED') return 7;
  return 1;
}

function getPendingNextStep(status) {
  if (status === 'FABRIC_ISSUED') return 'Send this job to Cutting.';
  if (status === 'SENT_TO_CUTTING') return 'Enter Cutting Details and complete cutting.';
  if (status === 'CUTTING_COMPLETED') return 'Assign lines and product to start production.';
  if (status === 'LINE_ASSIGNED') return 'Start Hourly Output entry.';
  if (status === 'LINE_IN_PROGRESS') return 'Continue hourly production or send produced qty to Washing.';
  if (status === 'LINE_COMPLETED') return 'Send qty to Washing transfer.';
  if (status === 'WASHING_OUT') return 'Complete washing and move this transfer to QC.';
  if (status === 'AFTER_WASH_RECEIVED') return 'Open QC and process pass/reject quantities.';
  if (status === 'PACKING_COMPLETED') return 'Open Final Checking and finalize batch.';
  if (status === 'WAREHOUSE_RECEIVED') return 'Job is fully completed.';
  return 'Follow the next action to proceed.';
}

function CollapsibleCard({ title, icon, open: controlledOpen, onToggle, children, defaultOpen = false }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle || (() => setInternalOpen((o) => !o));
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <i className={`bi ${icon} text-slate-500`} />
          {title}
        </span>
        <i className={`bi bi-chevron-down text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-3 border-t border-slate-100">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignForm, setAssignForm] = useState({ productId: '', assignments: [], showForm: false });
  const [openSection, setOpenSection] = useState({ fabric: true, cutting: true, line: true, washing: true });
  const [actionModal, setActionModal] = useState(null);
  const [confirmSendCutting, setConfirmSendCutting] = useState(false);
  const [washingForm, setWashingForm] = useState({ quantitySent: '', sentFrom: '' });
  const [assignRecipeModal, setAssignRecipeModal] = useState({ open: false, productId: null, label: '' });

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId).then((r) => r.data),
    enabled: !!jobId,
  });
  const { data: meta } = useQuery({
    queryKey: ['assign-meta', jobId],
    queryFn: () => getAssignLinesMeta(jobId).then((r) => r.data),
    enabled: !!jobId && job?.status === CAN_ASSIGN_LINES,
  });
  const { data: assignRecipe } = useQuery({
    queryKey: ['recipe', assignForm.productId],
    queryFn: () => getRecipeForProduct(assignForm.productId).then((r) => r.data),
    enabled: !!assignForm.productId && (assignForm.showForm || actionModal === 'assign'),
  });

  const sendCuttingMutation = useMutation({
    mutationFn: () => sendJobToCutting(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setActionModal(null);
      setConfirmSendCutting(false);
    },
  });
  const assignMutation = useMutation({
    mutationFn: (body) => assignLines(jobId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setAssignForm((f) => ({ ...f, showForm: false }));
      setActionModal(null);
    },
  });
  const washingMutation = useMutation({
    mutationFn: (body) => createWashingTransfer(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['washing'] });
      setActionModal(null);
      setWashingForm({ quantitySent: '', sentFrom: '' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500 animate-pulse flex items-center gap-2">
          <i className="bi bi-hourglass-split" /> Loading job...
        </p>
      </div>
    );
  }
  if (error) {
    const message = error?.response?.data?.error || error?.message || 'Failed to load job';
    const is404 = error?.response?.status === 404;
    return (
      <div className="min-h-[200px] p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-700 font-medium">{is404 ? 'Job not found' : 'Error'}</p>
        <p className="text-red-600 text-sm mt-1">{message}</p>
        <button onClick={() => navigate('/jobs')} className="mt-4 text-blue-600 hover:underline flex items-center gap-1">
          <i className="bi bi-arrow-left" /> Back to All Jobs
        </button>
      </div>
    );
  }
  if (!job || typeof job !== 'object') {
    return (
      <div className="min-h-[200px] p-6 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-600">Job not found.</p>
        <button onClick={() => navigate('/jobs')} className="mt-4 text-blue-600 hover:underline flex items-center gap-1">
          <i className="bi bi-arrow-left" /> Back to All Jobs
        </button>
      </div>
    );
  }

  const canSendToCutting = job.status === CAN_SEND_CUTTING;
  const canAssignLines = job.status === CAN_ASSIGN_LINES;
  const canSendToWashing = ['LINE_ASSIGNED', 'LINE_IN_PROGRESS', 'LINE_COMPLETED', 'WASHING_OUT'].includes(job.status);
  const totalCutPieces = job.totalCutPieces ?? 0;
  const totalAssigned = (assignForm.assignments || []).reduce((s, a) => s + (a.assignedQuantity || 0), 0);
  const assignValid = totalAssigned === totalCutPieces && totalCutPieces > 0 && assignForm.productId;
  const currentStep = getCurrentStep(job.status);
  const availableToSend = Number(job.availableToSend || 0);
  const pendingNextStep = getPendingNextStep(job.status);
  const handleWashingSubmit = (e) => {
    e.preventDefault();
    const qty = Number(washingForm.quantitySent || 0);
    if (qty <= 0 || qty > availableToSend) return;
    washingMutation.mutate({
      jobId: job._id,
      quantitySent: qty,
      sentFrom: washingForm.sentFrom || undefined,
    });
  };


  const handleAddLine = () => {
    const lines = meta?.lines || [];
    setAssignForm((f) => ({
      ...f,
      assignments: [...(f.assignments || []), { lineName: lines[0]?.name || '', assignedQuantity: 0 }],
    }));
  };
  const handleAssignChange = (idx, field, value) => {
    setAssignForm((f) => ({
      ...f,
      assignments: f.assignments.map((a, i) =>
        i === idx ? { ...a, [field]: field === 'assignedQuantity' ? Number(value) : value } : a
      ),
    }));
  };
  const handleAssignSubmit = (e) => {
    e.preventDefault();
    assignMutation.mutate({
      productId: assignForm.productId,
      assignments: assignForm.assignments.filter((a) => a.assignedQuantity > 0),
    });
  };

  let createdDate = '—';
  if (job.createdAt) {
    try {
      const d = new Date(job.createdAt);
      if (!Number.isNaN(d.getTime())) {
        createdDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch {
      createdDate = '—';
    }
  }

  const actions = [
    canSendToCutting && { id: 'send-cutting', label: 'Send to Cutting', icon: 'bi-send', primary: true, onClick: () => setConfirmSendCutting(true), loading: sendCuttingMutation.isPending },
    job.status === 'SENT_TO_CUTTING' && { id: 'cutting-details', label: 'Enter Cutting Details', icon: 'bi-pencil-square', onClick: () => navigate('/manufacturing/cutting') },
    canAssignLines && { id: 'assign-line', label: 'Assign to Line', icon: 'bi-people', primary: true, onClick: () => { setAssignForm((f) => ({ ...f, showForm: true, assignments: [{ lineName: meta?.lines?.[0]?.name || '', assignedQuantity: 0 }] })); setActionModal('assign'); } },
    // Pass jobId so HourlyProduction can preselect the job and show the table immediately.
    ['LINE_ASSIGNED', 'LINE_IN_PROGRESS'].includes(job.status) && { id: 'hourly', label: 'Hourly Output', icon: 'bi-clock', onClick: () => navigate(`/production/hourly?jobId=${job._id}`) },
    canSendToWashing && {
      id: 'washing-send',
      label: `Send to Washing${availableToSend > 0 ? ` (${availableToSend} avail.)` : ''}`,
      icon: 'bi-droplet',
      onClick: () => setActionModal('washing-send'),
    },
    ['LINE_COMPLETED', 'WASHING_OUT', 'LINE_IN_PROGRESS'].includes(job.status) && { id: 'washing', label: 'Open Washing Board', icon: 'bi-box-arrow-up-right', onClick: () => navigate('/manufacturing/washing') },
    ['AFTER_WASH_RECEIVED', 'PACKING_COMPLETED'].includes(job.status) && { id: 'qc', label: 'QC & Packing', icon: 'bi-clipboard-check', onClick: () => navigate('/manufacturing/qc') },
  ].filter(Boolean);

  return (
    <div className="space-y-6 min-h-0">
      <button
        onClick={() => navigate('/jobs')}
        className="text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
      >
        <i className="bi bi-arrow-left" /> All Jobs
      </button>

      {/* Job header */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{job.jobNumber} {job.styleRef ? `| ${job.styleRef}` : ''}</h1>
          <p className="text-slate-500 text-sm mt-1">Created on {createdDate} by Admin User</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Process tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, i) => {
            const done = currentStep > step.key || (currentStep === step.key && ['WAREHOUSE_RECEIVED', 'PACKING_COMPLETED'].includes(job.status));
            const current = currentStep === step.key && !done;
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      done ? 'bg-green-500 text-white' : current ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {done ? <i className="bi bi-check-lg" /> : step.key}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${current ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 rounded transition-colors duration-300 ${done ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🤖 AI Production Intelligence Panel */}
      <JobAIPanel jobId={job._id} jobNumber={job.jobNumber} />
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="bi bi-lightning-charge text-amber-500" />
            Next Step Actions
          </h2>
          <span className="text-slate-500 text-sm">Select the required action to proceed.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={a.onClick}
              disabled={a.loading}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                a.primary ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <i className={`bi ${a.icon}`} />
              {a.label}
              {a.loading && <span className="animate-spin">⏳</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <p className="text-sm">
          <span className="font-semibold">Pending Next Step:</span> {pendingNextStep}
        </p>
      </div>

      {/* Detail cards - collapsible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CollapsibleCard
          title="Fabric Issue Details"
          icon="bi-box-seam"
          open={openSection.fabric}
          onToggle={() => setOpenSection((s) => ({ ...s, fabric: !s.fabric }))}
          defaultOpen
        >
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div><dt className="text-slate-500">Fabric</dt><dd className="font-medium">—</dd></div>
            <div><dt className="text-slate-500">Issued Quantity</dt><dd className="font-medium">{job.issuedFabricQuantity} (yards)</dd></div>
            <div><dt className="text-slate-500">Accessories</dt><dd className="font-medium">{job.accessories ? 'Yes' : 'None'}</dd></div>
          </dl>
        </CollapsibleCard>

        <CollapsibleCard
          title="Cutting Section"
          icon="bi-scissors"
          open={openSection.cutting}
          onToggle={() => setOpenSection((s) => ({ ...s, cutting: !s.cutting }))}
        >
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-slate-500">Fabric Used</dt><dd className="font-medium">{job.fabricUsedQty ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Waste</dt><dd className="font-medium">{job.fabricWasteQty ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Total Cut Pieces</dt><dd className="font-medium">{job.totalCutPieces ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Reject</dt><dd className="font-medium">{job.cuttingRejectQty ?? '—'}</dd></div>
          </dl>
        </CollapsibleCard>

        {job.productId && (
          <div className="lg:col-span-2">
            <CollapsibleCard
              title="Product recipe (accessories per piece)"
              icon="bi-journal-richtext"
              defaultOpen
            >
              {job.recipe?.lines?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="pb-1">Material</th>
                      <th className="pb-1">Type</th>
                      <th className="pb-1">Qty / good piece</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.recipe.lines.map((l) => (
                      <tr key={l._id || l.materialId?._id} className="border-t border-slate-100">
                        <td className="py-1">{l.materialId?.name || '—'}</td>
                        <td className="py-1 capitalize">{l.materialId?.type || '—'}</td>
                        <td className="py-1 font-medium">{l.quantityPerUnit} {l.materialId?.unit || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-sm">
                  No recipe for <strong>{job.productId?.name || 'this product'}</strong>.{' '}
                  <Link to="/manufacturing/product-recipe" className="text-indigo-600 hover:underline">Add recipe</Link>
                </p>
              )}
              {job.recipe?.note && <p className="text-xs text-slate-500 mt-2 italic">{job.recipe.note}</p>}
            </CollapsibleCard>
          </div>
        )}

        <CollapsibleCard
          title="Line Production Summary"
          icon="bi-list-task"
          open={openSection.line}
          onToggle={() => setOpenSection((s) => ({ ...s, line: !s.line }))}
        >
          {(job.lineAssignments && job.lineAssignments.length > 0) ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pb-1">Line</th>
                  <th className="pb-1">Assigned Qty</th>
                  <th className="pb-1">Produced So Far</th>
                  <th className="pb-1">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {(job.lineAssignments || []).map((la) => (
                  <tr key={la._id} className="border-t border-slate-100">
                    <td className="py-0.5">{la.lineName}</td>
                    <td className="py-0.5">{la.assignedQuantity ?? '—'}</td>
                    <td className="py-0.5">{la.producedQty ?? 0}</td>
                    <td className="py-0.5">{la.remainingQty == null ? '—' : la.remainingQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">No line assignments yet.</p>
          )}
        </CollapsibleCard>

        <CollapsibleCard
          title="Washing / Gate Pass"
          icon="bi-droplet"
          open={openSection.washing}
          onToggle={() => setOpenSection((s) => ({ ...s, washing: !s.washing }))}
        >
          <p className="text-sm text-slate-600">Available to send: <strong>{job.availableToSend ?? 0}</strong></p>
        </CollapsibleCard>
      </div>

      {/* Confirm Send to Cutting */}
      {confirmSendCutting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 transform transition-transform duration-200">
            <h3 className="font-semibold text-slate-800 mb-2">Send to Cutting?</h3>
            <p className="text-slate-600 text-sm mb-4">This job will move to Cutting. You can then enter cutting details.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmSendCutting(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="button" onClick={() => { sendCuttingMutation.mutate(); }} disabled={sendCuttingMutation.isPending} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign lines modal */}
      {(actionModal === 'assign' || assignForm.showForm) && canAssignLines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto transform transition-transform duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assign lines (total must = {totalCutPieces})</h2>
              <button
                type="button"
                onClick={() => { setAssignForm((f) => ({ ...f, showForm: false })); setActionModal(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                <select
                  value={assignForm.productId}
                  onChange={(e) => setAssignForm((f) => ({ ...f, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select</option>
                  {(meta?.products || []).map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                {assignForm.productId && (
                  <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900 space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <i className="bi bi-journal-text" /> Product recipe (per finished piece)
                    </p>
                    {assignRecipe?.lines?.length ? (
                      <ul className="list-disc list-inside space-y-0.5 text-violet-800">
                        {assignRecipe.lines.map((l) => (
                          <li key={l._id || l.materialId?._id || l.materialId}>
                            {l.materialId?.name || 'Material'} — <strong>{l.quantityPerUnit}</strong> {l.materialId?.unit || 'pcs'} / pc
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-violet-700">No recipe yet for this product.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const p = (meta?.products || []).find((x) => String(x._id) === String(assignForm.productId));
                        setAssignRecipeModal({
                          open: true,
                          productId: assignForm.productId,
                          label: p?.name || '',
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg"
                    >
                      <i className="bi bi-journal-plus" />
                      {assignRecipe?.lines?.length ? 'Edit recipe' : 'Add recipe'}
                    </button>
                  </div>
                )}
              </div>
              {(assignForm.assignments || []).map((a, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={a.lineName}
                    onChange={(e) => handleAssignChange(idx, 'lineName', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  >
                    {(meta?.lines || []).map((l) => (
                      <option key={l._id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={a.assignedQuantity ?? ''}
                    onChange={(e) => handleAssignChange(idx, 'assignedQuantity', e.target.value)}
                    className="w-24 px-3 py-2 border rounded-lg"
                    placeholder="Qty"
                  />
                </div>
              ))}
              <button type="button" onClick={handleAddLine} className="text-blue-600 hover:underline text-sm">+ Add line</button>
              {assignMutation.isError && <p className="text-red-600 text-sm">{assignMutation.error?.response?.data?.error || assignMutation.error?.message || 'Failed to save'}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={!assignValid || assignMutation.isPending} className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50">
                  Save assignments
                </button>
                <button type="button" onClick={() => { setAssignForm((f) => ({ ...f, showForm: false })); setActionModal(null); }} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecipeEditorModal
        open={assignRecipeModal.open}
        onClose={() => setAssignRecipeModal({ open: false, productId: null, label: '' })}
        lockProductId={assignRecipeModal.productId}
        lockProductLabel={assignRecipeModal.label || undefined}
        onAfterSave={() => {
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['recipe', assignForm.productId] });
        }}
      />

      {/* Send to washing modal */}
      {actionModal === 'washing-send' && canSendToWashing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Send to Washing</h2>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleWashingSubmit} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Available to send from produced qty: <strong>{availableToSend}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to send *</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(0, availableToSend)}
                  value={washingForm.quantitySent}
                  onChange={(e) => setWashingForm((f) => ({ ...f, quantitySent: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Cannot exceed available produced qty.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sent from</label>
                <input
                  type="text"
                  value={washingForm.sentFrom}
                  onChange={(e) => setWashingForm((f) => ({ ...f, sentFrom: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Line / Section"
                />
              </div>
              {washingMutation.isError && (
                <p className="text-red-600 text-sm">
                  {washingMutation.error?.response?.data?.error || washingMutation.error?.message || 'Failed to send'}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    washingMutation.isPending ||
                    availableToSend <= 0 ||
                    Number(washingForm.quantitySent || 0) <= 0 ||
                    Number(washingForm.quantitySent || 0) > availableToSend
                  }
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
                >
                  Send Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
