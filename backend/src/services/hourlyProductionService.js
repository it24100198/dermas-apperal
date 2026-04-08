import { ManufacturingJob, HourlyProduction, JobLineAssignment } from '../models/index.js';
import { JOB_STATUS } from '../utils/statusMachine.js';

export async function listJobsForHourlyProduction(userEmployee) {
  const query = { status: { $in: [JOB_STATUS.LINE_ASSIGNED, JOB_STATUS.LINE_IN_PROGRESS] } };
  if (userEmployee?.productionSectionId && userEmployee.role === 'line_supervisor') {
    const section = userEmployee.productionSectionId;
    const lineName = section?.name || section?.slug;
    if (lineName) {
      const jobsWithLine = await ManufacturingJob.find(query)
        .populate('productId', 'name sku')
        .lean();
      const lineAssignments = await JobLineAssignment.find({ lineName }).distinct('jobId');
      return jobsWithLine.filter((j) => lineAssignments.some((id) => id.equals(j._id)));
    }
  }
  return ManufacturingJob.find(query)
    .populate('productId', 'name sku')
    .sort({ updatedAt: -1 })
    .lean();
}

export async function saveHourlyProduction(data) {
  const job = await ManufacturingJob.findById(data.jobId);
  if (!job) throw new Error('Job not found');
  if (![JOB_STATUS.LINE_ASSIGNED, JOB_STATUS.LINE_IN_PROGRESS].includes(job.status)) {
    throw new Error('Job must be LINE_ASSIGNED or LINE_IN_PROGRESS to record hourly production');
  }
  const ops = data.rows.map((r) => ({
    updateOne: {
      filter: {
        jobId: data.jobId,
        lineName: r.lineName,
        productionDate: r.productionDate,
        hour: r.hour,
        employeeId: r.employeeId,
      },
      update: { $set: { quantity: r.quantity } },
      upsert: true,
    },
  }));
  await HourlyProduction.bulkWrite(ops);
  if (job.status === JOB_STATUS.LINE_ASSIGNED) {
    job.status = JOB_STATUS.LINE_IN_PROGRESS;
    await job.save();
  }
  return { ok: true };
}
