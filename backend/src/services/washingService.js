import mongoose from 'mongoose';
import {
  ManufacturingJob,
  WashingTransfer,
  HourlyProduction,
  JobLineAssignment,
} from '../models/index.js';
import { JOB_STATUS, WASHING_TRANSFER_STATUS } from '../utils/statusMachine.js';

export async function getWashingView() {
  const [incomingPending, inProgressReceived, completedWashing, returned] = await Promise.all([
    WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.PENDING })
      .populate('jobId', 'jobNumber status')
      .sort({ createdAt: -1 })
      .lean(),
    WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.RECEIVED })
      .populate('jobId', 'jobNumber status')
      .sort({ createdAt: -1 })
      .lean(),
    WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.WASHING_COMPLETED })
      .populate('jobId', 'jobNumber status')
      .sort({ createdAt: -1 })
      .lean(),
    WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.RETURNED })
      .populate('jobId', 'jobNumber status')
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  return { incomingPending, inProgressReceived, completedWashing, returned };
}

async function getTotalProducedForJob(jobId) {
  const result = await HourlyProduction.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  const hourlyTotal = result[0]?.total ?? 0;
  if (hourlyTotal > 0) return hourlyTotal;

  // Fallback: if hourly is not entered yet, use assigned/cut quantity for completed line jobs.
  const [job, assigned] = await Promise.all([
    ManufacturingJob.findById(jobId).lean(),
    JobLineAssignment.aggregate([
      { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
      { $group: { _id: null, total: { $sum: '$assignedQuantity' } } },
    ]),
  ]);
  const assignedTotal = assigned[0]?.total ?? 0;
  if (assignedTotal > 0) return assignedTotal;
  return Number(job?.totalCutPieces || 0);
}

async function getTotalAlreadySentForJob(jobId) {
  const result = await WashingTransfer.aggregate([
    { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: null, total: { $sum: '$quantitySent' } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function getAvailableToSend(jobId) {
  const [produced, sent] = await Promise.all([
    getTotalProducedForJob(jobId),
    getTotalAlreadySentForJob(jobId),
  ]);
  return Math.max(0, produced - sent);
}

export async function createTransfer(data, session = null) {
  if (data.jobId) {
    const job = await ManufacturingJob.findById(data.jobId).session(session);
    if (!job) throw new Error('Job not found');
    const allowedJobStatuses = [
      JOB_STATUS.LINE_ASSIGNED,
      JOB_STATUS.LINE_IN_PROGRESS,
      JOB_STATUS.LINE_COMPLETED,
      JOB_STATUS.WASHING_OUT,
    ];
    if (!allowedJobStatuses.includes(job.status)) {
      throw new Error('Job must be LINE_ASSIGNED, LINE_IN_PROGRESS, LINE_COMPLETED, or WASHING_OUT to send washing transfer');
    }
    const available = await getAvailableToSend(data.jobId);
    if (data.quantitySent > available) {
      throw new Error(`Available to send: ${available}. Cannot send ${data.quantitySent}.`);
    }
    if (data.quantitySent <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
  const transfer = await WashingTransfer.create(
    [
      {
        jobId: data.jobId || undefined,
        quantitySent: data.quantitySent,
        sentFrom: data.sentFrom || '',
        status: WASHING_TRANSFER_STATUS.PENDING,
      },
    ],
    { session }
  ).then((r) => r[0]);
  if (data.jobId) {
    const job = await ManufacturingJob.findById(data.jobId).session(session);
    // LINE_ASSIGNED → WASHING_OUT (partial send without hourly entries)
    // LINE_COMPLETED → WASHING_OUT
    // LINE_IN_PROGRESS remains as-is (allow more hourly entries and further partial sends)
    if (job?.status === JOB_STATUS.LINE_COMPLETED || job?.status === JOB_STATUS.LINE_ASSIGNED) {
      await ManufacturingJob.updateOne(
        { _id: data.jobId },
        { $set: { status: JOB_STATUS.WASHING_OUT } },
        { session }
      );
    }
  }
  return transfer.toObject();
}

export async function receiveTransfer(transferId) {
  const transfer = await WashingTransfer.findById(transferId);
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status !== WASHING_TRANSFER_STATUS.PENDING) {
    throw new Error('Only pending transfers can be received');
  }
  transfer.status = WASHING_TRANSFER_STATUS.RECEIVED;
  await transfer.save();
  return transfer.toObject();
}

export async function completeWashing(transferId) {
  const transfer = await WashingTransfer.findById(transferId).populate('jobId');
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status !== WASHING_TRANSFER_STATUS.RECEIVED) {
    throw new Error('Only received transfers can be marked washing completed');
  }
  transfer.status = WASHING_TRANSFER_STATUS.WASHING_COMPLETED;
  await transfer.save();
  if (transfer.jobId) {
    await ManufacturingJob.updateOne(
      { _id: transfer.jobId._id },
      { $set: { status: JOB_STATUS.AFTER_WASH_RECEIVED } }
    );
  }
  return transfer.toObject();
}
