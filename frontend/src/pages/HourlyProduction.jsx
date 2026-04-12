import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { listHourlyJobs, saveHourlyProduction, getEmployees, getSections, getHourlyRecords } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

function formatDateHuman(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function SummaryCard({ label, value, helper, tone, icon }) {
  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/92 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md`}>
          <i className={`bi ${icon} text-[18px]`} />
        </span>
      </div>
    </article>
  );
}

export default function HourlyProduction() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const preselectedJobId = searchParams.get('jobId');

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedLineName, setSelectedLineName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedHour, setSelectedHour] = useState('all');
  const [selectedOperatorId, setSelectedOperatorId] = useState('all');
  const [modalHour, setModalHour] = useState(null);
  const [hourQuantities, setHourQuantities] = useState({});
  const [inlineEntries, setInlineEntries] = useState({});

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

  const employeesForEntry = useMemo(() => {
    if (selectedOperatorId === 'all') return employeesForLine;
    return employeesForLine.filter((emp) => emp._id === selectedOperatorId);
  }, [employeesForLine, selectedOperatorId]);

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

  const selectedJobTarget = Number(selectedJob?.totalCutPieces || selectedJob?.issuedFabricQuantity || 0);
  const selectedDateRecords = useMemo(
    () =>
      (existingRecords || []).filter(
        (r) => r.lineName === selectedLineName && r.productionDate === selectedDate
      ),
    [existingRecords, selectedLineName, selectedDate]
  );

  const todayProduced = useMemo(
    () => selectedDateRecords.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [selectedDateRecords]
  );

  const lockedHourCount = lockedHours.size;
  const pendingQuantity = Math.max(0, selectedJobTarget - todayProduced);

  const hourlyRows = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    const planned = selectedJobTarget > 0 ? Math.ceil(selectedJobTarget / HOURS.length) : 0;

    return HOURS.map((hour) => {
      const rowsForHour = selectedDateRecords.filter((row) => Number(row.hour) === hour);
      const rowsForHourByOperator =
        selectedOperatorId === 'all'
          ? rowsForHour
          : rowsForHour.filter((row) => row.employeeId === selectedOperatorId);
      const actualQty = rowsForHourByOperator.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
      const operatorCount = new Set(rowsForHourByOperator.filter((row) => Number(row.quantity || 0) > 0).map((row) => row.employeeId)).size;
      const locked = lockedHours.has(hour);

      let status = locked ? 'Locked' : 'Open';
      if (!locked && isToday && hour < currentHour) status = 'Pending';
      if (locked && actualQty >= planned && planned > 0) status = 'On Track';

      return {
        hour,
        plannedQty: planned,
        actualQty,
        defects: 0,
        operatorCount,
        locked,
        status,
      };
    });
  }, [selectedDate, selectedDateRecords, selectedJobTarget, lockedHours, selectedOperatorId]);

  const visibleHourlyRows = useMemo(() => {
    if (selectedHour === 'all') return hourlyRows;
    return hourlyRows.filter((row) => String(row.hour) === selectedHour);
  }, [hourlyRows, selectedHour]);

  const getInlineEntry = (hour, fallbackActualQty = 0, fallbackOperatorCount = 0) => {
    const existing = inlineEntries[hour];
    if (existing) return existing;
    return {
      actualQty: fallbackActualQty > 0 ? String(fallbackActualQty) : '',
      defects: '',
      operatorCount: fallbackOperatorCount > 0 ? String(fallbackOperatorCount) : '',
    };
  };

  const updateInlineEntry = (hour, patch) => {
    setInlineEntries((prev) => ({
      ...prev,
      [hour]: {
        ...(prev[hour] || { actualQty: '', defects: '', operatorCount: '' }),
        ...patch,
      },
    }));
  };

  const openHourModal = (hour) => {
    if (!selectedJobId || !selectedLineName) return;
    if (lockedHours.has(hour)) return;
    const initial = {};
    for (const emp of employeesForEntry) {
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

    const rows = employeesForEntry.map((emp) => ({
      lineName: selectedLineName,
      productionDate: selectedDate,
      hour: modalHour,
      employeeId: emp._id,
      quantity: Number(hourQuantities[emp._id] ?? 0) || 0,
    }));

    saveMutation.mutate({ jobId: selectedJobId, rows });
  };

  const handleInlineSave = (hour, fallbackActualQty = 0, fallbackOperatorCount = 0) => {
    if (!selectedJobId || !selectedLineName || lockedHours.has(hour)) return;

    const entry = getInlineEntry(hour, fallbackActualQty, fallbackOperatorCount);
    const quantity = Math.max(0, Number(entry.actualQty || 0));

    let targetEmployees = employeesForEntry;

    if (selectedOperatorId === 'all') {
      const requestedOperatorCount = Math.max(1, Number(entry.operatorCount || employeesForLine.length || 1));
      targetEmployees = employeesForLine.slice(0, requestedOperatorCount);
    }

    if (!targetEmployees.length) return;

    const baseQty = Math.floor(quantity / targetEmployees.length);
    const remainder = quantity % targetEmployees.length;

    const rows = targetEmployees.map((emp, index) => ({
      lineName: selectedLineName,
      productionDate: selectedDate,
      hour,
      employeeId: emp._id,
      quantity: baseQty + (index < remainder ? 1 : 0),
    }));

    saveMutation.mutate(
      { jobId: selectedJobId, rows },
      {
        onSuccess: () => {
          setInlineEntries((prev) => {
            const next = { ...prev };
            delete next[hour];
            return next;
          });
        },
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] md:p-8 lg:p-9">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Production Control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-[2.2rem]">Hourly Production</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Record line-wise hourly output, track progress, and monitor locked production hours.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <i className="bi bi-calendar2-event" />
              {formatDateHuman(selectedDate)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <i className="bi bi-diagram-3" />
              {selectedLineName || 'No line selected'}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm ${new Date().getHours() >= 8 && new Date().getHours() <= 20 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
              <i className="bi bi-clock-history" />
              {new Date().getHours() >= 8 && new Date().getHours() <= 20 ? 'Shift Active' : 'Shift Closed'}
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Filter and Selection</h2>
          <p className="text-sm text-slate-500">Select a job, production date, and hour slot to start recording output.</p>
        </div>

        {jobsLoading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading jobs and production setup...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Select Job</label>
              <select
                value={selectedJob?._id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const match = (jobs || []).find((j) => j._id === id) || null;
                  setSelectedJob(match);
                  setSelectedLineName('');
                  setSelectedOperatorId('all');
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (match?._id) next.set('jobId', match._id);
                    else next.delete('jobId');
                    return next;
                  });
                }}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select active job</option>
                {(jobs || []).map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.jobNumber} ({j.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Production Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Hour Slot</label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All hours</option>
                {HOURS.map((h) => (
                  <option key={h} value={String(h)}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Operator (Optional)</label>
              <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All operators</option>
                {employeesForLine.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name || emp._id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Section / Line</label>
              <select
                value={selectedLineName}
                onChange={(e) => setSelectedLineName(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {(lines || []).map((l) => (
                  <option key={l._id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {!jobsLoading && (!jobs || jobs.length === 0) && (
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <i className="bi bi-inbox text-2xl text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No active jobs available</h3>
          <p className="mt-1 text-sm text-slate-500">There are no LINE_ASSIGNED or LINE_IN_PROGRESS jobs available for hourly production entry right now.</p>
        </section>
      )}

      {!jobsLoading && jobs && jobs.length > 0 && !selectedJob && (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center shadow-sm">
          <i className="bi bi-list-task text-2xl text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">Select a job to begin hourly recording</h3>
          <p className="mt-1 text-sm text-slate-500">Choose a job from the filter card to view job summary, hourly table, and trend chart.</p>
        </section>
      )}

      {selectedJob && (
        <>
          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Job Summary</h2>
                <p className="text-sm text-slate-500">Selected job production context and current progress.</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Job ID</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedJob.jobNumber || selectedJob._id}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Product Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedJob.productId?.name || selectedJob.styleRef || 'Not specified'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Target Quantity</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedJobTarget}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Completed Quantity</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{todayProduced}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Remaining Quantity</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{pendingQuantity}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Line Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{String(selectedJob.status || 'N/A').replace(/_/g, ' ')}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Today Target" value={String(selectedJobTarget)} helper="Planned units for selected job" icon="bi-bullseye" tone="from-sky-500 to-cyan-500" />
            <SummaryCard label="Today Produced" value={String(todayProduced)} helper="Captured from hourly records" icon="bi-graph-up-arrow" tone="from-emerald-500 to-teal-500" />
            <SummaryCard label="Pending Quantity" value={String(pendingQuantity)} helper="Remaining to reach target" icon="bi-hourglass-split" tone="from-amber-500 to-orange-500" />
            <SummaryCard label="Locked Hours" value={String(lockedHourCount)} helper="Hours already finalized" icon="bi-lock" tone="from-indigo-500 to-blue-500" />
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Hourly Entry Table</h2>
                <p className="text-sm text-slate-500">Record per-hour output and review locked production slots.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {visibleHourlyRows.length} hour slot(s)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Hour</th>
                    <th className="px-4 py-3 font-semibold">Planned Qty</th>
                    <th className="px-4 py-3 font-semibold">Actual Qty</th>
                    <th className="px-4 py-3 font-semibold">Defects</th>
                    <th className="px-4 py-3 font-semibold">Operator Count</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHourlyRows.map((row) => (
                    <tr key={row.hour} className="border-t border-slate-100">
                      {(() => {
                        const entry = getInlineEntry(row.hour, row.actualQty, row.operatorCount);
                        const inlineQty = Number(entry.actualQty || 0);
                        const inlineOperators = Number(entry.operatorCount || 0);
                        const canSaveInline =
                          !row.locked &&
                          !saveMutation.isPending &&
                          selectedJobId &&
                          selectedLineName &&
                          employeesForEntry.length > 0 &&
                          inlineQty >= 0 &&
                          (selectedOperatorId !== 'all' || inlineOperators > 0);

                        return (
                          <>
                      <td className="px-4 py-3 font-medium text-slate-700">{String(row.hour).padStart(2, '0')}:00</td>
                      <td className="px-4 py-3 text-slate-700">{row.plannedQty}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.locked ? (
                          <span>{row.actualQty}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={entry.actualQty}
                            onChange={(e) => updateInlineEntry(row.hour, { actualQty: e.target.value })}
                            className="h-9 w-24 rounded-xl border border-slate-300 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder={String(row.actualQty || 0)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.locked ? (
                          <span>{row.defects}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={entry.defects}
                            onChange={(e) => updateInlineEntry(row.hour, { defects: e.target.value })}
                            className="h-9 w-20 rounded-xl border border-slate-300 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="0"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.locked ? (
                          <span>{row.operatorCount}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={entry.operatorCount}
                            onChange={(e) => updateInlineEntry(row.hour, { operatorCount: e.target.value })}
                            className="h-9 w-20 rounded-xl border border-slate-300 bg-white px-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder={selectedOperatorId === 'all' ? String(Math.max(1, row.operatorCount || employeesForLine.length || 1)) : '1'}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${row.locked ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {row.locked ? <i className="bi bi-lock-fill" /> : <i className="bi bi-unlock" />}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.locked ? (
                          <button type="button" disabled className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-500">
                            Locked
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={!canSaveInline}
                              onClick={() => handleInlineSave(row.hour, row.actualQty, row.operatorCount)}
                              className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Save inline
                            </button>
                            <button
                              type="button"
                              onClick={() => openHourModal(row.hour)}
                              className="inline-flex h-9 items-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Detailed
                            </button>
                          </div>
                        )}
                      </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!lockedHourCount && (
              <p className="mt-3 text-xs text-slate-500">
                Inline quick-entry saves and locks the selected hour immediately. Use Detailed for per-operator quantity distribution.
              </p>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Hourly Trend (Planned vs Actual)</h2>
              <p className="text-sm text-slate-500">Quick visual comparison of hourly plan against recorded output.</p>
            </div>

            <div className="space-y-3">
              {hourlyRows.map((row) => {
                const maxValue = Math.max(1, row.plannedQty, row.actualQty);
                const plannedWidth = `${Math.round((row.plannedQty / maxValue) * 100)}%`;
                const actualWidth = `${Math.round((row.actualQty / maxValue) * 100)}%`;

                return (
                  <div key={row.hour} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>{String(row.hour).padStart(2, '0')}:00</span>
                      <span>Planned {row.plannedQty} • Actual {row.actualQty}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Planned</div>
                        <div className="h-2.5 rounded-full bg-slate-200">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: plannedWidth }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Actual</div>
                        <div className="h-2.5 rounded-full bg-slate-200">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: actualWidth }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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

              {employeesForEntry.length === 0 ? (
                <p className="text-slate-500">No employees to record.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employeesForEntry.map((emp) => (
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
                disabled={lockedHours.has(modalHour) || saveMutation.isPending || employeesForEntry.length === 0}
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
