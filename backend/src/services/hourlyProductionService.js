import { ManufacturingJob, HourlyProduction, JobLineAssignment } from '../models/index.js';
import { JOB_STATUS } from '../utils/statusMachine.js';

const HOURLY_ELIGIBLE_STATUSES = [
  JOB_STATUS.LINE_ASSIGNED,
  JOB_STATUS.LINE_IN_PROGRESS,
  JOB_STATUS.LINE_COMPLETED,
  JOB_STATUS.WASHING_OUT,
  JOB_STATUS.AFTER_WASH_RECEIVED,
  JOB_STATUS.PACKING_COMPLETED,
];

export async function listJobsForHourlyProduction(userEmployee) {
  const query = { status: { $in: HOURLY_ELIGIBLE_STATUSES } };
  let restrictToLineName = null;

  if (userEmployee?.productionSectionId && userEmployee.role === 'line_supervisor') {
    const section = userEmployee.productionSectionId;
    const lineName = section?.name || section?.slug;
    if (lineName) restrictToLineName = lineName;
  }

  let jobs = await ManufacturingJob.find(query)
    .populate('productId', 'name sku')
    .lean();

  // Restrict visible jobs for line supervisor (only jobs that have this line assigned)
  if (restrictToLineName) {
    const jobIdsForLine = await JobLineAssignment.find({ lineName: restrictToLineName }).distinct('jobId');
    jobs = jobs.filter((j) => jobIdsForLine.some((id) => id.equals(j._id)));
  } else {
    jobs = jobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  if (!jobs.length) return jobs;

  // Attach producedQty / remainingQty for the visible jobs
  const jobIds = jobs.map((j) => j._id);
  if (restrictToLineName) {
    const [producedAgg, assignedAgg] = await Promise.all([
      HourlyProduction.aggregate([
        { $match: { jobId: { $in: jobIds }, lineName: restrictToLineName } },
        { $group: { _id: '$jobId', totalQty: { $sum: '$quantity' } } },
      ]),
      JobLineAssignment.aggregate([
        { $match: { jobId: { $in: jobIds }, lineName: restrictToLineName } },
        { $group: { _id: '$jobId', totalAssigned: { $sum: '$assignedQuantity' } } },
      ]),
    ]);

    const producedMap = new Map(producedAgg.map((a) => [String(a._id), a.totalQty || 0]));
    const assignedMap = new Map(assignedAgg.map((a) => [String(a._id), a.totalAssigned || 0]));

    return jobs.map((job) => {
      const producedQty = producedMap.get(String(job._id)) ?? 0;
      const assignedQty = assignedMap.get(String(job._id)) ?? 0;
      return {
        ...job,
        producedQty,
        remainingQty: Math.max(0, assignedQty - producedQty),
      };
    });
  }

  const producedAgg = await HourlyProduction.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: '$jobId', totalQty: { $sum: '$quantity' } } },
  ]);

  const producedMap = new Map(producedAgg.map((a) => [String(a._id), a.totalQty || 0]));

  return jobs.map((job) => {
    const producedQty = producedMap.get(String(job._id)) ?? 0;
    const remainingQty = job.totalCutPieces == null ? null : Math.max(0, job.totalCutPieces - producedQty);
    return { ...job, producedQty, remainingQty };
  });
}

export async function saveHourlyProduction(data) {
  const job = await ManufacturingJob.findById(data.jobId);
  if (!job) throw new Error('Job not found');
  if (!HOURLY_ELIGIBLE_STATUSES.includes(job.status)) {
    throw new Error('Job must be in LINE_ASSIGNED, LINE_IN_PROGRESS, LINE_COMPLETED or WASHING_OUT to record hourly production');
  }

  // Lock rule: once any record exists for (jobId + lineName + productionDate + hour),
  // that time slot becomes locked and cannot be edited again.
  const rows = (data.rows || []).map((r) => ({
    lineName: r.lineName,
    productionDate: r.productionDate,
    hour: Number(r.hour),
    employeeId: r.employeeId,
    quantity: r.quantity,
  }));

  // Deduplicate by employee within the same time slot.
  const deduped = new Map();
  for (const r of rows) {
    const k = `${r.lineName}|${r.productionDate}|${r.hour}|${r.employeeId}`;
    if (!deduped.has(k)) deduped.set(k, r);
  }
  const finalRows = Array.from(deduped.values());

  const hourKeys = new Map(); // key -> { lineName, productionDate, hour }
  for (const r of finalRows) {
    const k = `${r.lineName}|${r.productionDate}|${r.hour}`;
    if (!hourKeys.has(k)) {
      hourKeys.set(k, { lineName: r.lineName, productionDate: r.productionDate, hour: r.hour });
    }
  }

  const keys = Array.from(hourKeys.values());
  const existing = keys.length
    ? await HourlyProduction.find({
        jobId: data.jobId,
        $or: keys.map((k) => ({
          lineName: k.lineName,
          productionDate: k.productionDate,
          hour: k.hour,
        })),
      })
        .select({ _id: 1 })
        .lean()
    : [];

  if (existing.length > 0) {
    const err = new Error('This time slot is locked. You cannot edit production for the same hour.');
    err.status = 409;
    throw err;
  }

  await HourlyProduction.insertMany(
    finalRows.map((r) => ({
      jobId: data.jobId,
      lineName: r.lineName,
      productionDate: r.productionDate,
      hour: r.hour,
      employeeId: r.employeeId,
      quantity: r.quantity,
    })),
  );
  // Do NOT auto-change status — job stays LINE_ASSIGNED until manually marked complete
  return { ok: true };
}

export async function completeLineProduction(jobId) {
  const job = await ManufacturingJob.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (!HOURLY_ELIGIBLE_STATUSES.includes(job.status)) {
    throw new Error('Job must be in LINE_ASSIGNED, LINE_IN_PROGRESS, LINE_COMPLETED or WASHING_OUT to mark as completed');
  }
  job.status = JOB_STATUS.LINE_COMPLETED;
  await job.save();
  return { ok: true, status: job.status };
}

export async function getHourlyRecords(jobId, userEmployee) {
  const query = { jobId };

  // Line supervisor should only see records for their assigned line/section.
  if (userEmployee?.productionSectionId && userEmployee.role === 'line_supervisor') {
    const section = userEmployee.productionSectionId;
    const lineName = section?.name || section?.slug;
    if (lineName) query.lineName = lineName;
  }

  return HourlyProduction.find(query)
    .sort({ productionDate: 1, hour: 1 })
    .lean();
}
