import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { listHourlyJobs, saveHourlyProduction, getEmployees, getSections, getHourlyRecords } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

export default function HourlyProduction() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const preselectedJobId = searchParams.get('jobId');

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedLineName, setSelectedLineName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalHour, setModalHour] = useState(null);
  const [hourQuantities, setHourQuantities] = useState({});

  const { data: jobs, isLoading: jobsLoading } = useQuery({
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

  const selectedJobId = selectedJob?._id;

  const { data: existingRecords } = useQuery({
    queryKey: ['hourly-records', selectedJobId],
    queryFn: () => getHourlyRecords(selectedJobId).then((r) => r.data),
    enabled: !!selectedJobId,
  });

  // Preselect job from job detail link.
  useEffect(() => {
    if (!preselectedJobId) return;
    if (!jobs || jobs.length === 0) return;
    const match = jobs.find((j) => j._id === preselectedJobId);
    setSelectedJob(match || null);
    setSelectedLineName('');
  }, [preselectedJobId, jobs]);

  const linesFromRecords = useMemo(() => {
    const set = new Set((existingRecords || []).map((r) => r.lineName).filter(Boolean));
    return Array.from(set);
  }, [existingRecords]);

  useEffect(() => {
    if (selectedLineName) return;
    if (linesFromRecords.length > 0) {
      setSelectedLineName(linesFromRecords[0]);
      return;
    }
    if (lines.length > 0) setSelectedLineName(lines[0].name);
  }, [selectedLineName, linesFromRecords, lines]);

  const employeesForLine = useMemo(() => {
    if (!employees || !selectedLineName) return [];
    return employees.filter((emp) => {
      const sec = emp.productionSectionId;
      const n = sec?.name;
      const s = sec?.slug;
      return n === selectedLineName || s === selectedLineName;
    });
  }, [employees, selectedLineName]);

  const recordMap = useMemo(() => {
    const map = new Map();
    for (const r of existingRecords || []) {
      const k = `${r.lineName}|${r.productionDate}|${r.hour}|${r.employeeId}`;
      map.set(k, r.quantity);
    }
    return map;
  }, [existingRecords]);

  const lockedHours = useMemo(() => {
    const locked = new Set();
    for (const h of HOURS) {
      const hasAny = (existingRecords || []).some(
        (r) =>
          r.lineName === selectedLineName &&
          r.productionDate === selectedDate &&
          Number(r.hour) === h,
      );
      if (hasAny) locked.add(h);
    }
    return locked;
  }, [existingRecords, selectedLineName, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: (body) => saveHourlyProduction(body),
    onSuccess: (_res, variables) => {
      const jobId = variables?.jobId;
      if (jobId) queryClient.invalidateQueries({ queryKey: ['hourly-records', jobId] });
      queryClient.invalidateQueries({ queryKey: ['hourly-jobs'] });
      setModalHour(null);
      setHourQuantities({});
    },
  });

  const openHourModal = (hour) => {
    if (!selectedJobId || !selectedLineName) return;
    if (lockedHours.has(hour)) return;
    const initial = {};
    for (const emp of employeesForLine) {
      const k = `${selectedLineName}|${selectedDate}|${hour}|${emp._id}`;
      const existingQty = recordMap.get(k);
      initial[emp._id] = existingQty ?? '';
    }
    setHourQuantities(initial);
    setModalHour(hour);
  };

  const closeModal = () => {
    setModalHour(null);
    setHourQuantities({});
  };

  const handleSaveHour = () => {
    if (!selectedJobId || modalHour == null || !selectedLineName) return;
    if (lockedHours.has(modalHour)) return;

    const rows = employeesForLine.map((emp) => ({
      lineName: selectedLineName,
      productionDate: selectedDate,
      hour: modalHour,
      employeeId: emp._id,
      quantity: Number(hourQuantities[emp._id] ?? 0) || 0,
    }));

    saveMutation.mutate({ jobId: selectedJobId, rows });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Hourly production</h1>
      <p className="text-slate-500 mb-4">Jobs in LINE_ASSIGNED or LINE_IN_PROGRESS. Record production by line, date, hour, employee. Locked hours cannot be edited.</p>

      {jobsLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-2">Select job</label>
            <select
              value={selectedJob?._id ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                const match = (jobs || []).find((j) => j._id === id) || null;
                setSelectedJob(match);
                setSelectedLineName('');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (match?._id) next.set('jobId', match._id);
                  else next.delete('jobId');
                  return next;
                });
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">— Select —</option>
              {(jobs || []).map((j) => (
                <option key={j._id} value={j._id}>
                  {j.jobNumber} ({j.status})
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Job: {selectedJob.jobNumber} <StatusBadge status={selectedJob.status} />
              </p>

              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Line</label>
                  <select
                    value={selectedLineName}
                    onChange={(e) => setSelectedLineName(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    {lines.map((l) => (
                      <option key={l._id} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-3 py-2 sticky left-0 bg-slate-50 z-10">Employee</th>
                      {HOURS.map((h) => {
                        const locked = lockedHours.has(h);
                        return (
                          <th key={h} className="px-3 py-2 text-center min-w-[90px]">
                            <div className="flex items-center justify-center gap-2">
                              <span>{String(h).padStart(2, '0')}:00</span>
                              {locked ? <span className="text-xs text-amber-700">(Locked)</span> : null}
                            </div>
                            {!locked ? (
                              <button
                                type="button"
                                onClick={() => openHourModal(h)}
                                className="mt-1 px-2 py-1 bg-slate-800 text-white rounded text-xs hover:bg-slate-700"
                              >
                                Record
                              </button>
                            ) : (
                              <button type="button" disabled className="mt-1 px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs">
                                View
                              </button>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {employeesForLine.length === 0 ? (
                      <tr>
                        <td colSpan={HOURS.length + 1} className="px-3 py-6 text-center text-slate-500">
                          No employees for this line.
                        </td>
                      </tr>
                    ) : (
                      employeesForLine.map((emp) => (
                        <tr key={emp._id} className="border-t border-slate-100">
                          <td className="px-3 py-2 sticky left-0 bg-white z-0 font-medium">
                            {emp.name || emp._id}
                          </td>
                          {HOURS.map((h) => {
                            const k = `${selectedLineName}|${selectedDate}|${h}|${emp._id}`;
                            const qty = recordMap.get(k);
                            return (
                              <td key={h} className="px-3 py-2 text-center text-slate-700">
                                {qty != null ? qty : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {modalHour != null && selectedJobId && selectedLineName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-0.5">Record hourly production</h2>
                <p className="text-sm text-slate-600">
                  {selectedLineName} - {selectedDate} - {String(modalHour).padStart(2, '0')}:00
                </p>
              </div>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {saveMutation.isError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100" role="alert">
                  {saveMutation.error.response?.data?.error || saveMutation.error.message}
                </div>
              )}

              {employeesForLine.length === 0 ? (
                <p className="text-slate-500">No employees to record.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employeesForLine.map((emp) => (
                    <div key={emp._id} className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-700 truncate">{emp.name || emp._id}</div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={lockedHours.has(modalHour)}
                          value={hourQuantities[emp._id] ?? ''}
                          onChange={(e) => setHourQuantities((prev) => ({ ...prev, [emp._id]: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Qty"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50">
                Close
              </button>
              <button
                type="button"
                disabled={lockedHours.has(modalHour) || saveMutation.isPending || employeesForLine.length === 0}
                onClick={handleSaveHour}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
              >
                Save & lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
