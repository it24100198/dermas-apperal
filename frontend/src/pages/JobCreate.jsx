import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob, getMaterials } from '../api/client';

export default function JobCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    materialId: '',
    issuedFabricQuantity: '',
    styleRef: '',
    batchRef: '',
  });

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => getMaterials().then((r) => r.data),
  });
  const rawMaterials = materials || [];

  const createMutation = useMutation({
    mutationFn: (body) => createJob(body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${res.data._id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      materialId: form.materialId,
      issuedFabricQuantity: Number(form.issuedFabricQuantity),
      styleRef: form.styleRef || undefined,
      batchRef: form.batchRef || undefined,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Material issue (Create Job)</h1>
      <p className="text-slate-500 mb-4">Select raw material from inventory and issue quantity. This creates a MaterialIssue and a ManufacturingJob (FABRIC_ISSUED).</p>
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Raw material *</label>
            <select
              value={form.materialId}
              onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select raw material</option>
              {rawMaterials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.type}) — stock {m.stockQty} {m.unit}
                  {m.unitPrice != null && Number(m.unitPrice) > 0 ? ` · Rs.${Number(m.unitPrice).toLocaleString()}/${m.unit}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issued fabric quantity *</label>
            <input
              type="number"
              min="0.001"
              step="any"
              value={form.issuedFabricQuantity}
              onChange={(e) => setForm((f) => ({ ...f, issuedFabricQuantity: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Style ref</label>
            <input
              type="text"
              value={form.styleRef}
              onChange={(e) => setForm((f) => ({ ...f, styleRef: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Batch ref</label>
            <input
              type="text"
              value={form.batchRef}
              onChange={(e) => setForm((f) => ({ ...f, batchRef: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/jobs')} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50">
              Create Job
            </button>
          </div>
        </form>
        {createMutation.isError && (
          <p className="mt-2 text-red-600 text-sm">{createMutation.error.response?.data?.error}</p>
        )}
      </div>
    </div>
  );
}
