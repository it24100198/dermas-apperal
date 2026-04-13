import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { listHourlyJobs, saveHourlyProduction, getEmployees, getSections, getHourlyRecords } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateLabel(dateString) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function getShiftLabel(hour) {
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  return 'Evening';
}

function getLineName(section) {
  if (!section) return 'No line selected';
  return section.name || section.slug || 'Assigned line';
}

function getJobTarget(job) {
  return Number(job?.totalCutPieces ?? job?.issuedFabricQuantity ?? 0);
}

export default function HourlyProduction() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId');

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedLineName, setSelectedLineName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedHour, setSelectedHour] = useState(HOURS[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [modalHour, setModalHour] = useState(null);
  const [hourQuantities, setHourQuantities] = useState({});

  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['hourly-jobs'],
    queryFn: () => listHourlyJobs().then((r) => r.data),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees().then((r) => r.data),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', 'line'],
    queryFn: () => getSections({ type: 'line' }).then((r) => r.data),
  });

  const selectedJobId = selectedJob?._id;

  const { data: existingRecords = [] } = useQuery({
    queryKey: ['hourly-records', selectedJobId],
    queryFn: () => getHourlyRecords(selectedJobId).then((r) => r.data),
    enabled: !!selectedJobId,
  });

  const currentDateLabel = formatDateLabel(selectedDate);
  const currentHour = new Date().getHours();
  const shiftLabel = getShiftLabel(currentHour);

  useEffect(() => {
    if (!preselectedJobId || jobs.length === 0) return;
    const match = jobs.find((job) => job._id === preselectedJobId);
    setSelectedJob(match || null);
    setSelectedLineName('');
    setSelectedEmployeeId('');
  }, [preselectedJobId, jobs]);

  const availableLineNames = useMemo(() => {
    const fromSections = (sections || []).map((section) => section.name || section.slug).filter(Boolean);
    const fromRecords = (existingRecords || []).map((record) => record.lineName).filter(Boolean);
    const merged = new Set([...fromRecords, ...fromSections]);
    if (selectedLineName) merged.add(selectedLineName);
    return Array.from(merged);
  }, [existingRecords, sections, selectedLineName]);

  useEffect(() => {
    if (selectedLineName) return;
    if ((existingRecords || []).length > 0) {
      const lineFromRecords = (existingRecords || []).find((record) => record.lineName)?.lineName;
      if (lineFromRecords) {
        setSelectedLineName(lineFromRecords);
        return;
      }
    }
    if (sections.length > 0) {
      setSelectedLineName(sections[0].name || sections[0].slug || '');
    }
  }, [existingRecords, sections, selectedLineName]);

  const selectedLineSection = useMemo(
    () => sections.find((section) => (section.name || section.slug) === selectedLineName) || null,
    [sections, selectedLineName]
  );

  const employeesForLine = useMemo(() => {
    if (!selectedLineName) return [];
    return employees.filter((employee) => {
      const sec = employee.productionSectionId;
      const secName = sec?.name || sec?.slug;
      return secName === selectedLineName;
    });
  }, [employees, selectedLineName]);

  useEffect(() => {
    if (selectedEmployeeId && employeesForLine.some((employee) => employee._id === selectedEmployeeId)) return;
    setSelectedEmployeeId(employeesForLine[0]?._id || '');
  }, [employeesForLine, selectedEmployeeId]);

  const selectedEmployee = useMemo(
    () => employeesForLine.find((employee) => employee._id === selectedEmployeeId) || null,
    [employeesForLine, selectedEmployeeId]
  );

  const recordsForSelectedLine = useMemo(() => {
    if (!selectedLineName) return [];
    return (existingRecords || []).filter((record) => record.lineName === selectedLineName && record.productionDate === selectedDate);
  }, [existingRecords, selectedLineName, selectedDate]);

  const recordsAllTime = existingRecords || [];

  const actualByHour = useMemo(() => {
    const map = new Map(HOURS.map((hour) => [hour, 0]));
    for (const record of recordsForSelectedLine) {
      const hour = Number(record.hour);
      if (map.has(hour)) {
        map.set(hour, map.get(hour) + Number(record.quantity || 0));
      }
    }
    return map;
  }, [recordsForSelectedLine]);

  const totalActualToday = useMemo(
    () => Array.from(actualByHour.values()).reduce((sum, value) => sum + value, 0),
    [actualByHour]
  );

  const lockedHours = useMemo(() => {
    const locked = new Set();
    for (const record of recordsForSelectedLine) {
      locked.add(Number(record.hour));
    }
    return locked;
  }, [recordsForSelectedLine]);

  const selectedJobTarget = selectedJob ? getJobTarget(selectedJob) : 0;
  const completedQuantity = useMemo(
    () => recordsAllTime.reduce((sum, record) => sum + Number(record.quantity || 0), 0),
    [recordsAllTime]
  );
  const remainingQuantity = Math.max(selectedJobTarget - totalActualToday, 0);
  const lockedHourCount = lockedHours.size;
  const todayTarget = selectedJobTarget;
  const todayProduced = totalActualToday;
  const pendingQuantity = Math.max(todayTarget - todayProduced, 0);

  const plannedByHour = useMemo(() => {
    const map = new Map();
    if (selectedJobTarget <= 0) {
      for (const hour of HOURS) map.set(hour, 0);
      return map;
    }
    const base = Math.floor(selectedJobTarget / HOURS.length);
    let remainder = selectedJobTarget % HOURS.length;
    for (const hour of HOURS) {
      const extra = remainder > 0 ? 1 : 0;
      map.set(hour, base + extra);
      if (remainder > 0) remainder -= 1;
    }
    return map;
  }, [selectedJobTarget]);

  const chartData = useMemo(
    () => HOURS.map((hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      planned: plannedByHour.get(hour) || 0,
      actual: actualByHour.get(hour) || 0,
    })),
    [actualByHour, plannedByHour]
  );

  const lineStatus = selectedJob?.status === 'LINE_IN_PROGRESS'
    ? 'Live'
    : selectedJob?.status === 'LINE_ASSIGNED'
      ? 'Ready'
      : selectedJob
        ? 'Idle'
        : 'No job selected';

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
    for (const employee of employeesForLine) {
      const key = `${selectedLineName}|${selectedDate}|${hour}|${employee._id}`;
      initial[employee._id] = existingRecords.find((record) => `${record.lineName}|${record.productionDate}|${record.hour}|${record.employeeId}` === key)?.quantity ?? '';
    }
    setHourQuantities(initial);
    setModalHour(hour);
    setSelectedHour(hour);
  };

  const closeModal = () => {
    setModalHour(null);
    setHourQuantities({});
  };

  const handleSaveHour = () => {
    if (!selectedJobId || modalHour == null || !selectedLineName) return;
    if (lockedHours.has(modalHour)) return;

    const rows = employeesForLine.map((employee) => ({
      lineName: selectedLineName,
      productionDate: selectedDate,
      hour: modalHour,
      employeeId: employee._id,
      quantity: Number(hourQuantities[employee._id] ?? 0) || 0,
    }));

    saveMutation.mutate({ jobId: selectedJobId, rows });
  };

  const noJobsAvailable = !jobsLoading && jobs.length === 0;
  const noSelectionYet = !jobsLoading && jobs.length > 0 && !selectedJob;

  const selectedJobLabel = selectedJob
    ? `${selectedJob.jobNumber}${selectedJob.productId?.name ? ` · ${selectedJob.productId.name}` : ''}`
    : 'No job selected';

  const sectionLabel = selectedLineSection ? getLineName(selectedLineSection) : (selectedLineName || 'No line selected');

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/85">
                <i className="bi bi-clock-history" />
                Supervisor production board
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hourly Production</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Record line-wise hourly output, track progress, and monitor locked production hours.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Current date</p>
                <p className="mt-1 font-semibold text-white">{currentDateLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Assigned line</p>
                <p className="mt-1 font-semibold text-white">{sectionLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Shift status</p>
                <p className="mt-1 font-semibold text-white">{shiftLabel} shift · {selectedJob ? lineStatus : 'Idle'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select Job</label>
              <select
                value={selectedJob?._id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const match = jobs.find((job) => job._id === id) || null;
                  setSelectedJob(match);
                  setSelectedLineName('');
                  setSelectedEmployeeId('');
                  setSelectedHour(HOURS[0]);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (match?._id) next.set('jobId', match._id);
                    else next.delete('jobId');
                    return next;
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">— Select a job —</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.jobNumber} · {job.productId?.name || 'Product'} · {job.status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Production Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Hour Slot</label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Operator focus</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">All operators</option>
                {employeesForLine.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name || employee.employeeId || employee._id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Section / Line</label>
              <select
                value={selectedLineName}
                onChange={(e) => setSelectedLineName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">— Select line —</option>
                {availableLineNames.map((lineName) => (
                  <option key={lineName} value={lineName}>
                    {lineName}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current board</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p><span className="font-medium text-slate-900">Job:</span> {selectedJobLabel}</p>
                <p><span className="font-medium text-slate-900">Line:</span> {sectionLabel}</p>
                <p><span className="font-medium text-slate-900">Operators:</span> {employeesForLine.length || 0}</p>
              </div>
            </div>

            <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="button"
                onClick={() => openHourModal(selectedHour)}
                disabled={!selectedJob || !selectedLineName}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <i className="bi bi-plus-circle" />
                Open selected slot
              </button>
              <button
                type="button"
                onClick={() => refetchJobs()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <i className="bi bi-arrow-repeat" />
                Refresh jobs
              </button>
              {selectedEmployee && (
                <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                  Focused operator: <span className="font-medium">{selectedEmployee.name || selectedEmployee.employeeId || selectedEmployee._id}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected slot</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{String(selectedHour).padStart(2, '0')}:00</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <i className="bi bi-calendar3" />
                {selectedDate}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use the selector to jump to a target hour, open the slot, and record production for the selected line.
            </p>
          </div>
        </div>
      </section>

      {jobsLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm text-slate-500">Loading hourly jobs...</p>
        </div>
      ) : noJobsAvailable ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <i className="bi bi-inbox text-2xl" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No active jobs available</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            There are no jobs currently assigned to hourly production. Once a job moves into LINE_ASSIGNED or LINE_IN_PROGRESS, it will appear here for production entry.
          </p>
        </div>
      ) : noSelectionYet ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <i className="bi bi-arrow-down-right-circle" />
                Start here
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Select a job to unlock production entry</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Once you choose a job, the dashboard will show the job summary, hourly performance, locked hours, and the entry grid for the selected line.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active jobs</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{jobs.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected line</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{sectionLabel}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Job summary</h2>
                  <p className="mt-1 text-sm text-slate-500">A quick overview of the selected production job.</p>
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryTile label="Job ID" value={selectedJob.jobNumber} icon="bi-hash" />
                <SummaryTile label="Product Name" value={selectedJob.productId?.name || 'Unnamed product'} icon="bi-box" />
                <SummaryTile label="Target Quantity" value={formatNumber(selectedJobTarget)} icon="bi-bullseye" />
                <SummaryTile label="Completed Quantity" value={formatNumber(completedQuantity)} icon="bi-check2-circle" />
                <SummaryTile label="Remaining Quantity" value={formatNumber(remainingQuantity)} icon="bi-hourglass-split" />
                <SummaryTile label="Line Status" value={lineStatus} icon="bi-activity" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <KpiCard label="Today Target" value={formatNumber(todayTarget)} accent="from-slate-900 to-slate-700" icon="bi-bullseye" helper="Planned output for the selected line" />
              <KpiCard label="Today Produced" value={formatNumber(todayProduced)} accent="from-emerald-600 to-green-500" icon="bi-graph-up-arrow" helper="Actual recorded output" />
              <KpiCard label="Pending Quantity" value={formatNumber(pendingQuantity)} accent="from-amber-600 to-orange-500" icon="bi-clock-history" helper="Remaining output to reach the target" />
              <KpiCard label="Locked Hours" value={formatNumber(lockedHourCount)} accent="from-cyan-600 to-sky-500" icon="bi-lock-fill" helper="Hours already recorded for the selected date" />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Hourly entry table</h2>
                <p className="mt-1 text-sm text-slate-500">Planned load versus actual output, with locked production hours clearly marked.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {sectionLabel} · {selectedDate}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Hour</th>
                      <th className="px-4 py-3 text-left font-medium">Planned Qty</th>
                      <th className="px-4 py-3 text-left font-medium">Actual Qty</th>
                      <th className="px-4 py-3 text-left font-medium">Defects</th>
                      <th className="px-4 py-3 text-left font-medium">Operator Count</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {HOURS.map((hour, index) => {
                      const plannedQty = plannedByHour.get(hour) || 0;
                      const actualQty = actualByHour.get(hour) || 0;
                      const isLocked = lockedHours.has(hour);
                      const isSelected = selectedHour === hour;
                      const defects = 0;
                      const statusText = isLocked ? 'Locked' : actualQty > 0 ? 'Recorded' : 'Open';

                      return (
                        <tr
                          key={hour}
                          className={`transition-colors ${isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50/70'} ${isLocked ? 'opacity-90' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{String(hour).padStart(2, '0')}:00</span>
                              {isLocked && <i className="bi bi-lock-fill text-amber-600" />}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{formatNumber(plannedQty)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{formatNumber(actualQty)}</span>
                              {actualQty > plannedQty && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">Over</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{formatNumber(defects)}</td>
                          <td className="px-4 py-4 text-slate-700">{employeesForLine.length || 0}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isLocked ? 'bg-amber-100 text-amber-800' : actualQty > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                              <i className={`bi ${isLocked ? 'bi-lock-fill' : actualQty > 0 ? 'bi-check2-circle' : 'bi-dot'}`} />
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={isLocked || !selectedJob || !selectedLineName}
                              onClick={() => openHourModal(hour)}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${isLocked ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              <i className={`bi ${isLocked ? 'bi-lock-fill' : 'bi-pencil-square'}`} />
                              {isLocked ? 'Locked' : index === HOURS.findIndex((slot) => slot === selectedHour) ? 'Record selected slot' : 'Record'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Hourly trend chart</h2>
                  <p className="mt-1 text-sm text-slate-500">Planned versus actual output for the selected line and date.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {selectedJob.productId?.name || 'Selected job'}
                </span>
              </div>

              <div className="mt-5 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 18, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Bar dataKey="planned" name="Planned" fill="#0f172a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Entry preview</h2>
                  <p className="mt-1 text-sm text-slate-500">Selected slot and recent output snapshot.</p>
                </div>
                <i className="bi bi-graph-up text-xl text-sky-500" />
              </div>

              <div className="mt-5 space-y-3">
                {chartData.slice(Math.max(chartData.length - 5, 0)).map((entry) => (
                  <div key={entry.hour} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-900">{entry.hour}</span>
                      <span className="text-slate-500">Planned {formatNumber(entry.planned)} · Actual {formatNumber(entry.actual)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500"
                        style={{ width: `${Math.min(100, entry.planned > 0 ? (entry.actual / Math.max(entry.planned, entry.actual, 1)) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {modalHour != null && selectedJobId && selectedLineName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Record hourly production</h2>
                <p className="text-sm text-slate-600">
                  {sectionLabel} · {selectedDate} · {String(modalHour).padStart(2, '0')}:00
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              {saveMutation.isError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {saveMutation.error.response?.data?.error || saveMutation.error.message}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                <MiniStat label="Selected job" value={selectedJob.jobNumber} />
                <MiniStat label="Target qty" value={formatNumber(selectedJobTarget)} />
                <MiniStat label="Operators" value={formatNumber(employeesForLine.length || 0)} />
              </div>

              {employeesForLine.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  No operators available for this line.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {employeesForLine.map((employee) => {
                    const isFocused = selectedEmployeeId === employee._id;
                    return (
                      <div key={employee._id} className={`rounded-2xl border p-4 transition ${isFocused ? 'border-sky-300 bg-sky-50/70' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{employee.name || employee.employeeId || employee._id}</p>
                            <p className="text-xs text-slate-500">{employee.employeeId || 'Operator'}</p>
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              disabled={lockedHours.has(modalHour)}
                              value={hourQuantities[employee._id] ?? ''}
                              onChange={(e) => setHourQuantities((prev) => ({ ...prev, [employee._id]: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100"
                              placeholder="Qty"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <div className="text-sm text-slate-500">
                {lockedHours.has(modalHour) ? 'This hour is locked and cannot be edited.' : 'You can save production for this hour now.'}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Close
                </button>
                <button
                  type="button"
                  disabled={lockedHours.has(modalHour) || saveMutation.isPending || employeesForLine.length === 0}
                  onClick={handleSaveHour}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <i className={`bi ${saveMutation.isPending ? 'bi-arrow-repeat animate-spin' : 'bi-save2'}`} />
                  Save & lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, icon, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
