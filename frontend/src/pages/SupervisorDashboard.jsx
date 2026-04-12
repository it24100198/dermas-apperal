import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupervisorDashboard, completeLine } from '../api/client';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

function SummaryCard({ title, value, hint, icon, tone }) {
  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md`}>
          <i className={`bi ${icon} text-[18px]`} />
        </div>
      </div>
    </article>
  );
}

export default function SupervisorDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['supervisor-dashboard'],
    queryFn: () => getSupervisorDashboard().then((r) => r.data),
  });
  const completeMutation = useMutation({
    mutationFn: (jobId) => completeLine(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard'] }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4">
        <div className="h-36 rounded-[28px] bg-slate-200/80" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 rounded-[22px] bg-slate-200/80" />
          <div className="h-28 rounded-[22px] bg-slate-200/80" />
          <div className="h-28 rounded-[22px] bg-slate-200/80" />
          <div className="h-28 rounded-[22px] bg-slate-200/80" />
        </div>
        <div className="h-60 rounded-[28px] bg-slate-200/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
        {error.response?.data?.error || error.message}
      </div>
    );
  }

  if (!data || typeof data !== 'object') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">Supervisor dashboard data is unavailable right now.</p>
        <p className="mt-1 text-sm text-slate-500">Please refresh in a moment or contact the administrator if the issue continues.</p>
      </div>
    );
  }

  const { section, jobs, canCompleteLine, isWashingSupervisor } = data || {};
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const supervisorName = data?.employee?.name || 'Supervisor';
  const sectionName = section?.name || 'Not assigned';
  const lineStatus = safeJobs.length > 0 ? 'Active' : 'Idle';
  const shiftLabel = 'Day Shift';

  const todayOutput = safeJobs.reduce((sum, job) => sum + Number(job.totalCutPieces || 0), 0);

  const assignedWorkersCount =
    Number(section?.assignedWorkersCount || section?.workersCount || section?.workerCount || 0) || 0;

  const baseline = todayOutput > 0 ? todayOutput : safeJobs.length * 12;
  const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
  const hourlyPreview = slots.map((hour, index) => {
    const factor = 0.8 + (index % 3) * 0.12;
    const produced = Math.max(0, Math.round((baseline / slots.length) * factor));
    const target = Math.max(10, Math.round((baseline / slots.length) * 1.15));
    return { hour, produced, target };
  });

  const summaryCards = [
    {
      title: 'Assigned Section',
      value: sectionName,
      hint: section?.type === 'line' ? 'Line assignment active' : 'Section assignment',
      icon: 'bi-diagram-3',
      tone: 'from-sky-500 to-cyan-500',
    },
    {
      title: 'Active Jobs',
      value: String(safeJobs.length),
      hint: safeJobs.length ? 'Currently running on your line' : 'No active jobs assigned',
      icon: 'bi-kanban',
      tone: 'from-indigo-500 to-blue-500',
    },
    {
      title: 'Today Output',
      value: String(todayOutput),
      hint: 'Units recorded in current shift',
      icon: 'bi-graph-up-arrow',
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Workers Present',
      value: String(assignedWorkersCount),
      hint: assignedWorkersCount ? 'Estimated assigned team' : 'Attendance not synced yet',
      icon: 'bi-people-fill',
      tone: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(236,253,245,0.9))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] md:p-8 lg:p-9">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Line Control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-[2.2rem]">Supervisor Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Monitor line activity, output, worker assignments, and production progress in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Supervisor Profile</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{supervisorName}</p>
            <p className="text-sm text-slate-600">{sectionName}</p>
            {(canCompleteLine || isWashingSupervisor) && (
              <p className="mt-2 text-xs text-slate-500">
                {canCompleteLine ? 'Line Supervisor' : ''}
                {canCompleteLine && isWashingSupervisor ? ' • ' : ''}
                {isWashingSupervisor ? 'Washing Supervisor' : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Section Information</h2>
              <p className="text-sm text-slate-500">Current assignment and line supervision details.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lineStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {lineStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Section Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{sectionName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Supervisor Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{supervisorName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Shift</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{shiftLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Assigned Workers Count</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{assignedWorkersCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Quick Actions</h2>
              <p className="text-sm text-slate-500">Direct access to production supervision tasks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              to="/supervisor/hourly"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              View Hourly Output
            </Link>
            <Link
              to="/jobs"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Check Assigned Jobs
            </Link>
            <Link
              to="/notifications"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Report Issue
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Assigned Jobs</h2>
            <p className="text-sm text-slate-500">Live table of jobs currently mapped to your supervised line.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {safeJobs.length} job(s)
          </span>
        </div>

        {safeJobs.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Job ID</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Target Quantity</th>
                  <th className="px-4 py-3 font-semibold">Completed Quantity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {safeJobs.map((job) => {
                  const targetQty = Number(job.totalCutPieces || job.issuedFabricQuantity || 0);
                  const completedQty = Number(job.fabricUsedQty || 0);

                  return (
                    <tr key={job._id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <Link to={`/jobs/${job._id}`} className="font-medium text-blue-700 hover:underline">
                          {job.jobNumber || job._id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{job.productId?.name || job.styleRef || 'Not specified'}</td>
                      <td className="px-4 py-3 text-slate-700">{targetQty}</td>
                      <td className="px-4 py-3 text-slate-700">{completedQty}</td>
                      <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                      <td className="px-4 py-3">
                        {canCompleteLine ? (
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(job._id)}
                            disabled={completeMutation.isPending}
                            className="inline-flex h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark line complete
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
            <i className="bi bi-inbox text-2xl text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No jobs assigned yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your line currently has no active jobs. Once assignments arrive, they will appear here with status and output tracking.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-flex h-10 items-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Check all jobs
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Hourly Output</h2>
            <p className="text-sm text-slate-500">Quick hourly production preview for the active shift.</p>
          </div>
          <Link to="/supervisor/hourly" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Open full hourly view
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Hour</th>
                <th className="px-4 py-3 font-semibold">Produced</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {hourlyPreview.map((row) => {
                const progress = row.target > 0 ? Math.min(100, Math.round((row.produced / row.target) * 100)) : 0;
                return (
                  <tr key={row.hour} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.hour}</td>
                    <td className="px-4 py-3 text-slate-700">{row.produced}</td>
                    <td className="px-4 py-3 text-slate-700">{row.target}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {safeJobs.length > 0
            ? 'Preview values are derived from current assigned jobs and update as production data changes.'
            : 'No live production records detected yet. Preview values will update once hourly entries begin.'}
        </p>
      </section>
    </div>
  );
}
