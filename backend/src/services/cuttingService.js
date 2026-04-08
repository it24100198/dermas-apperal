import { ManufacturingJob } from '../models/index.js';
import { JOB_STATUS } from '../utils/statusMachine.js';
import { assertTransition } from '../utils/statusMachine.js';

export async function listCuttingJobs() {
  return ManufacturingJob.find({ status: JOB_STATUS.SENT_TO_CUTTING })
    .populate('productId', 'name sku')
    .sort({ createdAt: -1 })
    .lean();
}

export async function saveCuttingRecord(jobId, data) {
  const job = await ManufacturingJob.findById(jobId);
  if (!job) throw new Error('Job not found');
  assertTransition(job.status, JOB_STATUS.CUTTING_COMPLETED);
  job.fabricUsedQty = data.fabricUsedQty;
  job.fabricWasteQty = data.fabricWasteQty;
  job.totalCutPieces = data.totalCutPieces;
  job.cuttingRejectQty = data.cuttingRejectQty;
  job.status = JOB_STATUS.CUTTING_COMPLETED;
  await job.save();
  return job.toObject();
}
