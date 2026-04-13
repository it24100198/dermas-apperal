import { useRef } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getEmployees, getHourlyRecords, getSupervisorDashboard } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const HOURLY_HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getSectionLabel(section) {
  if (!section) return 'Unassigned';
  return section.name || section.slug || 'Assigned section';
}

function getSupervisorLabel(employee, user) {
  return employee?.name || user?.name || user?.email || 'Supervisor not set';
}

function getLineStatus(jobs = [], section) {
  if (!section) return 'No section assigned';
  if ((jobs || []).some((job) => job.status === 'LINE_IN_PROGRESS')) return 'Running';
  if ((jobs || []).some((job) => job.status === 'LINE_ASSIGNED')) return 'Ready to start';
  return section.isActive ? 'Idle' : 'Inactive';
}

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const jobsSectionRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['supervisor-dashboard'],
    queryFn: () => getSupervisorDashboard().then((r) => r.data),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees().then((r) => r.data),
  });

  const jobs = data?.jobs || [];
  const section = data?.section || null;
  const employee = data?.employee || null;
  const supervisorName = getSupervisorLabel(employee, employee?.userId);
  const sectionLabel = getSectionLabel(section);

  const activeJobQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ['supervisor-hourly-preview', job._id],
      queryFn: () => getHourlyRecords(job._id).then((r) => r.data),
      enabled: Boolean(job?._id),
    })),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error.response?.data?.error || error.message}</div>;

  const sectionEmployees = employees.filter((emp) => {
    const assignedSection = emp.productionSectionId;
    const assignedSectionId = assignedSection && typeof assignedSection === 'object' ? assignedSection._id : assignedSection;
    return section && String(assignedSectionId || '') === String(section._id) && emp.userId?.isActive !== false;
  });

  const today = new Date().toISOString().slice(0, 10);
  const hourTotals = new Map(HOURLY_HOURS.map((hour) => [hour, 0]));
  const jobRows = jobs.map((job, index) => {
    const records = activeJobQueries[index]?.data || [];
    const completedQuantity = records.reduce((sum, record) => sum + Number(record.quantity || 0), 0);

    for (const record of records) {
      if (record.productionDate === today && hourTotals.has(Number(record.hour))) {
        hourTotals.set(Number(record.hour), hourTotals.get(Number(record.hour)) + Number(record.quantity || 0));
      }
    }

    return {
      ...job,
      completedQuantity,
      targetQuantity: Number(job.totalCutPieces ?? job.issuedFabricQuantity ?? 0),
    };
  });

  const hourlyTotals = HOURLY_HOURS.map((hour) => ({
    hour,
    quantity: hourTotals.get(hour) || 0,
  }));

  const hourlyRows = { jobRows, hourlyTotals };

  const activeJobs = hourlyRows.jobRows.length;
  const todayOutput = hourlyRows.hourlyTotals.reduce((sum, entry) => sum + entry.quantity, 0);
  const workersPresent = sectionEmployees.length;
  const maxHourQuantity = Math.max(...hourlyRows.hourlyTotals.map((entry) => entry.quantity), 0);
  const lineStatus = getLineStatus(jobs, section);
  const isEmpty = jobs.length === 0;

  const summaryCards = [
    {
      label: 'Assigned Section',
      value: sectionLabel,
      icon: 'bi-building',
      accent: 'from-slate-900 via-slate-800 to-cyan-700',
      note: section?.slug ? `Section code ${section.slug}` : 'No active section linked',
    },
    {
      label: 'Active Jobs',
      value: formatNumber(activeJobs),
      icon: 'bi-kanban',
      accent: 'from-cyan-700 to-teal-500',
      note: activeJobs > 0 ? 'Jobs currently assigned to this line' : 'Awaiting new assignments',
    },
    {
      label: 'Today Output',
      value: formatNumber(todayOutput),
      icon: 'bi-graph-up-arrow',
      accent: 'from-slate-800 to-teal-600',
      note: 'Summed from recorded hourly production',
    },
    {
      label: 'Workers Present',
      value: formatNumber(workersPresent),
      icon: 'bi-people',
      accent: 'from-slate-700 to-cyan-600',
      note: 'Active employees assigned to this section',
    },
  ];

  const completionRate = (job) => {
    if (!job.targetQuantity) return 0;
    return Math.min(100, Math.round((job.completedQuantity / job.targetQuantity) * 100));
  };

  const scrollToJobs = () => {
    jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-300/60 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/85">
                <i className="bi bi-shield-check" />
                Supervisor workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Supervisor Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Monitor line activity, output, worker assignments, and production progress in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Supervisor</p>
                <p className="mt-1 font-semibold text-white">{supervisorName}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Section</p>
                <p className="mt-1 font-semibold text-white">{sectionLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-300/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                  <i className={`bi ${card.icon} text-lg`} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{card.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Section information</h2>
              <p className="mt-1 text-sm text-slate-600">Current line assignment and operating status.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
              <i className="bi bi-broadcast" />
              {lineStatus}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Section Name" value={sectionLabel} icon="bi-building" />
            <InfoItem label="Supervisor Name" value={supervisorName} icon="bi-person-badge" />
            <InfoItem label="Shift" value={section?.shift || 'Not specified'} icon="bi-clock" />
            <InfoItem label="Line Status" value={lineStatus} icon="bi-activity" />
            <InfoItem label="Assigned Workers Count" value={formatNumber(workersPresent)} icon="bi-people" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-600">Fast access to the most important supervisor tasks.</p>
            </div>
            <i className="bi bi-lightning-charge text-xl text-cyan-600" />
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => navigate('/production/hourly')}
              className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/70"
            >
              <span>
                <span className="block font-medium text-slate-900">View Hourly Output</span>
                <span className="block text-sm text-slate-600">Open the hourly production board.</span>
              </span>
              <i className="bi bi-arrow-up-right text-cyan-700" />
            </button>

            <button
              type="button"
              onClick={scrollToJobs}
              className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/70"
            >
              <span>
                <span className="block font-medium text-slate-900">Check Assigned Jobs</span>
                <span className="block text-sm text-slate-600">Jump directly to the job table.</span>
              </span>
              <i className="bi bi-list-check text-cyan-700" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/jobs/create')}
              className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.95),rgba(14,116,144,0.85))] px-4 py-3 text-left transition hover:brightness-105"
            >
              <span>
                <span className="block font-medium text-white">Report Issue</span>
                <span className="block text-sm text-slate-200">Start a new material issue workflow.</span>
              </span>
              <i className="bi bi-exclamation-triangle text-cyan-200" />
            </button>
          </div>
        </div>
      </section>

      <section ref={jobsSectionRef} className="rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assigned jobs</h2>
            <p className="mt-1 text-sm text-slate-600">Track production, output, and status for the jobs assigned to this section.</p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
            {formatNumber(activeJobs)} active jobs
          </span>
        </div>

        {isEmpty ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <i className="bi bi-inbox text-2xl text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No jobs assigned right now</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your section is ready, but there are no active jobs to display yet. Once a job is assigned, output and progress will appear here automatically.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/production/hourly')}
                className="rounded-xl bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-105"
              >
                Open Hourly Output
              </button>
              <button
                type="button"
                onClick={() => navigate('/jobs/create')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Create Issue
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Job ID</th>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-left font-medium">Target Quantity</th>
                    <th className="px-4 py-3 text-left font-medium">Completed Quantity</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {hourlyRows.jobRows.map((job) => (
                    <tr key={job._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <Link to={`/jobs/${job._id}`} className="font-medium text-slate-900 hover:text-sky-700 hover:underline">
                          {job.jobNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <div className="font-medium text-slate-900">{job.productId?.name || 'Unnamed product'}</div>
                        <div className="text-xs text-slate-500">{job.productId?.sku || 'No SKU available'}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{formatNumber(job.targetQuantity)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900">{formatNumber(job.completedQuantity)}</span>
                          <span className="text-xs text-slate-500">{completionRate(job)}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-slate-800 via-slate-700 to-cyan-500"
                            style={{ width: `${completionRate(job)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={job.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Hourly output</h2>
            <p className="mt-1 text-sm text-slate-600">A quick view of today&apos;s hourly production across assigned jobs.</p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
            {formatNumber(todayOutput)} units today
          </span>
        </div>

        {todayOutput === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No hourly production has been recorded for today yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex h-64 items-end gap-2 rounded-2xl border border-slate-300/70 bg-slate-50 px-4 py-4">
                {hourlyRows.hourlyTotals.map((entry) => {
                  const height = maxHourQuantity > 0 ? Math.max(10, (entry.quantity / maxHourQuantity) * 100) : 10;
                  return (
                    <div key={entry.hour} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div className="text-xs font-medium text-slate-600">{formatNumber(entry.quantity)}</div>
                      <div className="flex w-full items-end justify-center">
                        <div
                          className="w-full max-w-[28px] rounded-t-xl bg-gradient-to-t from-slate-900 via-slate-700 to-teal-500 shadow-sm"
                          style={{ height: `${height}%` }}
                          title={`${String(entry.hour).padStart(2, '0')}:00 - ${entry.quantity}`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500">{String(entry.hour).padStart(2, '0')}:00</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300/70 bg-white/85 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Output preview</h3>
              <div className="mt-4 space-y-3">
                {hourlyRows.hourlyTotals.slice(-5).map((entry) => (
                  <div key={entry.hour} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{String(entry.hour).padStart(2, '0')}:00</span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(entry.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today output</p>
                <p className="mt-2 text-2xl font-semibold">{formatNumber(todayOutput)}</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-300/70 bg-white/70 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] text-white shadow-sm">
          <i className={`bi ${icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
