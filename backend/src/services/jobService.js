import {
  ManufacturingJob,
  Material,
  MaterialIssue,
  JobLineAssignment,
  ProductionSection,
  Product,
} from '../models/index.js';
import { getNextJobNumber } from '../utils/jobNumber.js';
import { assertTransition, JOB_STATUS } from '../utils/statusMachine.js';
import { withTransaction } from '../utils/withTransaction.js';
import * as washingService from './washingService.js';

export async function listJobs(filters = {}) {
  const query = {};
  const includeAvailableToSend =
    filters.includeAvailableToSend === true || filters.includeAvailableToSend === 'true';
  const washingEligibleOnly =
    filters.washingEligibleOnly === true || filters.washingEligibleOnly === 'true';

  if (washingEligibleOnly) {
    query.status = { $in: [JOB_STATUS.LINE_IN_PROGRESS, JOB_STATUS.LINE_COMPLETED, JOB_STATUS.WASHING_OUT] };
  } else if (filters.status) {
    query.status = filters.status;
  }

  const jobs = await ManufacturingJob.find(query)
    .populate('productId', 'name sku')
    .sort({ createdAt: -1 })
    .lean();

  if (!includeAvailableToSend) return jobs;

  const withAvailable = await Promise.all(
    jobs.map(async (job) => ({
      ...job,
      availableToSend: await washingService.getAvailableToSend(job._id),
    }))
  );
  return withAvailable;
}

export async function getJob(jobId) {
  const job = await ManufacturingJob.findById(jobId)
    .populate('productId', 'name sku')
    .populate('materialIssueId')
    .lean();
  if (!job) throw new Error('Job not found');
  const [lineAssignments, availableToSend] = await Promise.all([
    JobLineAssignment.find({ jobId }).lean(),
    jobId ? washingService.getAvailableToSend(jobId) : Promise.resolve(0),
  ]);
  return { ...job, lineAssignments, availableToSend };
}

export async function createJob(data, userId) {
  const material = await Material.findById(data.materialId);
  if (!material) throw new Error('Material not found');
  if (material.type !== 'fabric') throw new Error('Material must be fabric type');
  if (material.stockQty < data.issuedFabricQuantity) {
    throw new Error(`Insufficient fabric. Available: ${material.stockQty}`);
  }
  return withTransaction(async (session) => {
    const jobNumber = await getNextJobNumber();
    const materialIssue = await MaterialIssue.create(
      [
        {
          materialId: data.materialId,
          quantityIssued: data.issuedFabricQuantity,
          issuedTo: 'Manufacturing Job',
          jobId: null,
          issuedBy: userId,
        },
      ],
      { session }
    ).then((r) => r[0]);
    await Material.updateOne(
      { _id: data.materialId },
      { $inc: { stockQty: -data.issuedFabricQuantity } },
      { session }
    );
    const job = await ManufacturingJob.create(
      [
        {
          jobNumber,
          materialIssueId: materialIssue._id,
          styleRef: data.styleRef || '',
          batchRef: data.batchRef || '',
          issuedFabricQuantity: data.issuedFabricQuantity,
          accessories: data.accessories || null,
          status: JOB_STATUS.FABRIC_ISSUED,
          issueDate: new Date(),
          createdBy: userId,
        },
      ],
      { session }
    ).then((r) => r[0]);
    await MaterialIssue.updateOne(
      { _id: materialIssue._id },
      { $set: { jobId: job._id } },
      { session }
    );
    return job.toObject();
  });
}

export async function sendToCutting(jobId) {
  const job = await ManufacturingJob.findById(jobId);
  if (!job) throw new Error('Job not found');
  assertTransition(job.status, JOB_STATUS.SENT_TO_CUTTING);
  job.status = JOB_STATUS.SENT_TO_CUTTING;
  await job.save();
  return job.toObject();
}

export async function getAssignLinesMeta() {
  const [lines, products] = await Promise.all([
    ProductionSection.find({ type: 'line', isActive: true }).sort({ name: 1 }).lean(),
    Product.find({ classification: 'normal' }).sort({ name: 1 }).lean(),
  ]);
  return { lines, products };
}

export async function assignLines(jobId, data) {
  const job = await ManufacturingJob.findById(jobId);
  if (!job) throw new Error('Job not found');
  assertTransition(job.status, JOB_STATUS.LINE_ASSIGNED);
  const totalAssigned = data.assignments.reduce((s, a) => s + a.assignedQuantity, 0);
  if (totalAssigned !== job.totalCutPieces) {
    throw new Error(
      `Total assigned (${totalAssigned}) must equal totalCutPieces (${job.totalCutPieces})`
    );
  }
  return withTransaction(async (session) => {
    await JobLineAssignment.deleteMany({ jobId }, { session });
    await JobLineAssignment.insertMany(
      data.assignments.map((a) => ({
        jobId,
        lineName: a.lineName,
        assignedQuantity: a.assignedQuantity,
        dispatchDate: a.dispatchDate || new Date(),
      })),
      { session }
    );
    job.productId = data.productId;
    job.status = JOB_STATUS.LINE_ASSIGNED;
    await job.save({ session });
    if (data.materialIssues?.length) {
      const { Material, MaterialIssue } = await import('../models/index.js');
      for (const mi of data.materialIssues) {
        const mat = await Material.findById(mi.materialId).session(session);
        if (!mat || mat.stockQty < mi.quantityIssued) {
          throw new Error(`Insufficient material ${mi.materialId}`);
        }
        await Material.updateOne(
          { _id: mi.materialId },
          { $inc: { stockQty: -mi.quantityIssued } },
          { session }
        );
        await MaterialIssue.create(
          [
            {
              materialId: mi.materialId,
              quantityIssued: mi.quantityIssued,
              issuedTo: mi.issuedTo || 'Line assignment',
              jobId,
              issuedBy: job.createdBy,
            },
          ],
          { session }
        );
      }
    }
    return job.toObject();
  });
}
