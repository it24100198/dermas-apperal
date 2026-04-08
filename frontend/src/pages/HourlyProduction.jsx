import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listHourlyJobs, saveHourlyProduction, getEmployees, getSections } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function HourlyProduction() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState(null);
  const [rows, setRows] = useState([]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['hourly-jobs'],
    queryFn: () => listHourlyJobs().then((r) => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees().then((r) => r.data),
  });
  const { data: sections } = useQuery({
    queryKey: ['sections', 'line'],
    queryFn: () => getSections({ type: 'line' }).then((r) => r.data),
  });
  const lines = sections || [];
  const saveMutation = useMutation({
    mutationFn: (body) => saveHourlyProduction(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hourly-jobs'] });
      setRows([]);
      setSelectedJob(null);
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const addRow = () => {
    setRows((r) => [...r, { lineName: lines[0]?.name || '', productionDate: today, hour: new Date().getHours(), employeeId: (employees || [])[0]?._id || '', quantity: 0 }]);
  };
  const updateRow = (idx, field, value) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };
  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    const validRows = rows
      .filter((row) => row.lineName && row.employeeId && (row.quantity >= 0 || row.quantity === 0))
      .map((r) => ({
        lineName: r.lineName,
        productionDate: r.productionDate,
        hour: Number(r.hour),
        employeeId: r.employeeId,
        quantity: Number(r.quantity),
      }));
    if (validRows.length === 0) return;
    saveMutation.mutate({ jobId: selectedJob._id, rows: validRows });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Hourly production</h1>
      <p className="text-slate-500 mb-4">Jobs in LINE_ASSIGNED or LINE_IN_PROGRESS. Record production by line, date, hour, employee.</p>
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-2">Select job</label>
            <select
              value={selectedJob?._id ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedJob((jobs || []).find((j) => j._id === id) || null);
                setRows([]);
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">— Select —</option>
              {(jobs || []).map((j) => (
                <option key={j._id} value={j._id}>{j.jobNumber} ({j.status})</option>
              ))}
            </select>
          </div>
          {selectedJob && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-4">Job: {selectedJob.jobNumber} <StatusBadge status={selectedJob.status} /></p>
              <button type="button" onClick={addRow} className="mb-4 text-blue-600 hover:underline">+ Add row</button>
              <form onSubmit={handleSave} className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <select
                      value={row.lineName}
                      onChange={(e) => updateRow(idx, 'lineName', e.target.value)}
                      className="px-2 py-1.5 border rounded w-32"
                    >
                      <option value="">Line</option>
                      {lines.map((l) => (
                        <option key={l._id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={row.productionDate}
                      onChange={(e) => updateRow(idx, 'productionDate', e.target.value)}
                      className="px-2 py-1.5 border rounded w-36"
                    />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="Hour"
                      value={row.hour ?? ''}
                      onChange={(e) => updateRow(idx, 'hour', e.target.value)}
                      className="px-2 py-1.5 border rounded w-16"
                    />
                    <select
                      value={row.employeeId}
                      onChange={(e) => updateRow(idx, 'employeeId', e.target.value)}
                      className="px-2 py-1.5 border rounded w-40"
                    >
                      <option value="">Select employee</option>
                      {(employees || []).map((emp) => (
                        <option key={emp._id} value={emp._id}>{emp.name || emp._id}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={row.quantity ?? ''}
                      onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                      className="px-2 py-1.5 border rounded w-20"
                    />
                  </div>
                ))}
                <button type="submit" disabled={rows.length === 0 || saveMutation.isPending} className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50">
                  Save production
                </button>
              </form>
              {saveMutation.isError && <p className="mt-2 text-red-600 text-sm">{saveMutation.error.response?.data?.error}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
