import {
  WashingTransfer,
  QcCheck,
  PackingBatch,
  Material,
  MaterialIssue,
  ManufacturingJob,
} from '../models/index.js';
import { WASHING_TRANSFER_STATUS, PACKING_BATCH_STATUS, PACKING_BATCH_TYPE } from '../utils/statusMachine.js';
import { withTransaction } from '../utils/withTransaction.js';

function generateBatchCode(jobNumber = 'JOB', batchType = PACKING_BATCH_TYPE.GOOD) {
  const typeKey = batchType === PACKING_BATCH_TYPE.GOOD ? 'GOOD' : 'DMG';
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  const jobKey = String(jobNumber || 'JOB').replace(/[^A-Za-z0-9]/g, '').slice(-8) || 'JOB';
  return `${jobKey}-${typeKey}-${ts}${rand}`;
}

export async function listQcTransfers() {
  return WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.WASHING_COMPLETED })
    .populate('jobId', 'jobNumber productId status')
    .populate('jobId.productId', 'name sku')
    .sort({ updatedAt: -1 })
    .lean();
}

// List jobs that have at least one washing_completed transfer (for job-level QC view)
export async function listQcJobs() {
  const transfers = await WashingTransfer.find({ status: WASHING_TRANSFER_STATUS.WASHING_COMPLETED })
    .populate('jobId', 'jobNumber productId status')
    .sort({ updatedAt: -1 })
    .lean();

  // Group by jobId
  const map = new Map();
  for (const t of transfers) {
    const key = t.jobId?._id ? String(t.jobId._id) : `standalone-${t._id}`;
    if (!map.has(key)) {
      map.set(key, { job: t.jobId, transfers: [], totalQty: 0, latestUpdatedAt: t.updatedAt });
    }
    const g = map.get(key);
    g.transfers.push(t);
    g.totalQty += Number(t.quantitySent || 0);
    if (new Date(t.updatedAt) > new Date(g.latestUpdatedAt)) g.latestUpdatedAt = t.updatedAt;
  }

  // For each job group, check if QC already done (all transfers have QcCheck)
  const groups = Array.from(map.values());
  const result = await Promise.all(groups.map(async (g) => {
    const transferIds = g.transfers.map((t) => t._id);
    const qcChecks = await QcCheck.find({ washingTransferId: { $in: transferIds } }).lean();
    const qcDoneCount = qcChecks.length;
    return {
      jobId: g.job?._id,
      job: g.job,
      transfers: g.transfers,
      totalQty: g.totalQty,
      qcDoneCount,
      transferCount: g.transfers.length,
      allQcDone: qcDoneCount >= g.transfers.length,
      latestUpdatedAt: g.latestUpdatedAt,
    };
  }));

  // Sort: pending QC first
  return result.sort((a, b) => (a.allQcDone ? 1 : -1));
}

// Get all washing_completed transfers for a job + existing QC checks
export async function getJobQcDetail(jobId) {
  const job = await ManufacturingJob.findById(jobId).populate('productId').lean();
  if (!job) throw new Error('Job not found');

  const transfers = await WashingTransfer.find({
    jobId,
    status: WASHING_TRANSFER_STATUS.WASHING_COMPLETED,
  }).lean();

  if (!transfers.length) throw new Error('No washing-completed transfers found for this job');

  const transferIds = transfers.map((t) => t._id);
  const [qcChecks, packingBatches] = await Promise.all([
    QcCheck.find({ washingTransferId: { $in: transferIds } }).lean(),
    PackingBatch.find({ washingTransferId: { $in: transferIds } }).lean(),
  ]);

  const qcByTransfer = new Map(qcChecks.map((q) => [String(q.washingTransferId), q]));
  const batchesByTransfer = new Map();
  for (const b of packingBatches) {
    const k = String(b.washingTransferId);
    if (!batchesByTransfer.has(k)) batchesByTransfer.set(k, []);
    batchesByTransfer.get(k).push(b);
  }

  const totalQty = transfers.reduce((s, t) => s + (t.quantitySent || 0), 0);
  const enrichedTransfers = transfers.map((t) => ({
    ...t,
    qcCheck: qcByTransfer.get(String(t._id)) || null,
    packingBatches: batchesByTransfer.get(String(t._id)) || [],
  }));

  const allQcDone = enrichedTransfers.every((t) => t.qcCheck != null);
  const pendingTransfers = enrichedTransfers.filter((t) => t.qcCheck == null);

  return { job, transfers: enrichedTransfers, totalQty, allQcDone, pendingTransfers };
}

// Save QC for a single transfer (used by job-level QC page, one transfer at a time)
export async function saveQcForTransfer(transferId, data, userId) {
  return saveQc(transferId, data, userId);
}

export async function getQcDetail(transferId) {
  const transfer = await WashingTransfer.findById(transferId)
    .populate('jobId')
    .lean();
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status !== WASHING_TRANSFER_STATUS.WASHING_COMPLETED) {
    throw new Error('Transfer must be washing_completed for QC');
  }
  let job = null;
  if (transfer.jobId) {
    job = await ManufacturingJob.findById(transfer.jobId._id).populate('productId').lean();
  }
  let qcCheck = await QcCheck.findOne({ washingTransferId: transferId }).lean();
  let packingBatches = await PackingBatch.find({ washingTransferId: transferId }).lean();
  // Self-heal: if QcCheck exists but batches missing, create them
  if (qcCheck && (!packingBatches || packingBatches.length === 0)) {
    const jobId = transfer.jobId?._id;
    if (jobId) {
      const goodBatch = await PackingBatch.create({
        jobId,
        washingTransferId: transferId,
        batchCode: generateBatchCode(job.jobNumber, PACKING_BATCH_TYPE.GOOD),
        type: PACKING_BATCH_TYPE.GOOD,
        quantity: qcCheck.finishedGoodQty,
        status: PACKING_BATCH_STATUS.PACKING,
      });
      const damageBatch = await PackingBatch.create({
        jobId,
        washingTransferId: transferId,
        batchCode: generateBatchCode(job.jobNumber, PACKING_BATCH_TYPE.DAMAGE),
        type: PACKING_BATCH_TYPE.DAMAGE,
        quantity: qcCheck.damagedQty,
        status: PACKING_BATCH_STATUS.PACKING,
      });
      packingBatches = [goodBatch.toObject(), damageBatch.toObject()];
    }
  }
  // Backfill missing batch codes for existing data.
  const missingCodes = (packingBatches || []).filter((b) => !b.batchCode);
  for (const b of missingCodes) {
    const batchCode = generateBatchCode(job?.jobNumber || transfer.jobId?.jobNumber, b.type);
    await PackingBatch.updateOne({ _id: b._id }, { $set: { batchCode } });
    b.batchCode = batchCode;
  }
  return { transfer, job, qcCheck, packingBatches };
}

export async function saveQc(transferId, data, userId) {
  const transfer = await WashingTransfer.findById(transferId);
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status !== WASHING_TRANSFER_STATUS.WASHING_COMPLETED) {
    throw new Error('Transfer must be washing_completed for QC');
  }
  if (data.finishedGoodQty + data.damagedQty !== transfer.quantitySent) {
    throw new Error(
      `finished_good_qty + damaged_qty must equal transfer quantity (${transfer.quantitySent})`
    );
  }
  const jobId = transfer.jobId;
  if (!jobId) throw new Error('QC requires a job-linked transfer');
  const job = await ManufacturingJob.findById(jobId).lean();
  const jobNumber = job?.jobNumber || String(jobId);

  return withTransaction(async (session) => {
    const existing = await QcCheck.findOne({ washingTransferId: transferId }).session(session);
    if (existing) throw new Error('QC already saved for this transfer');
    const qcCheck = await QcCheck.create(
      [
        {
          washingTransferId: transferId,
          totalChecked: data.finishedGoodQty + data.damagedQty,
          finishedGoodQty: data.finishedGoodQty,
          damagedQty: data.damagedQty,
          notes: data.notes || '',
        },
      ],
      { session }
    ).then((r) => r[0]);
    await PackingBatch.create(
      [
        {
          jobId,
          washingTransferId: transferId,
          batchCode: generateBatchCode(jobNumber, PACKING_BATCH_TYPE.GOOD),
          type: PACKING_BATCH_TYPE.GOOD,
          quantity: data.finishedGoodQty,
          status: PACKING_BATCH_STATUS.PACKING,
        },
        {
          jobId,
          washingTransferId: transferId,
          batchCode: generateBatchCode(jobNumber, PACKING_BATCH_TYPE.DAMAGE),
          type: PACKING_BATCH_TYPE.DAMAGE,
          quantity: data.damagedQty,
          status: PACKING_BATCH_STATUS.PACKING,
        },
      ],
      { session }
    );
    return qcCheck.toObject();
  });
}

export async function issueAccessoryToBatch(batchId, data, userId) {
  const batch = await PackingBatch.findById(batchId);
  if (!batch) throw new Error('Packing batch not found');
  const material = await Material.findById(data.materialId);
  if (!material) throw new Error('Material not found');
  if (material.stockQty < data.quantityIssued) {
    throw new Error(`Insufficient stock. Available: ${material.stockQty}`);
  }
  return withTransaction(async (session) => {
    await Material.updateOne(
      { _id: data.materialId },
      { $inc: { stockQty: -data.quantityIssued } },
      { session }
    );
    await MaterialIssue.create(
      [
        {
          materialId: data.materialId,
          quantityIssued: data.quantityIssued,
          issuedTo: data.issuedTo || 'Packing batch',
          jobId: batch.jobId,
          packingBatchId: batchId,
          issuedBy: userId,
        },
      ],
      { session }
    );
    return { ok: true };
  });
}

export async function sendBatchToFinalCheck(batchId) {
  const batch = await PackingBatch.findById(batchId);
  if (!batch) throw new Error('Packing batch not found');
  if (batch.status !== PACKING_BATCH_STATUS.PACKING) {
    throw new Error('Batch must be in packing status');
  }
  batch.status = PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK;
  await batch.save();

  const batchesOfTransfer = await PackingBatch.find({
    washingTransferId: batch.washingTransferId,
  });
  const allSent =
    batch.washingTransferId &&
    batchesOfTransfer.every((b) => b.status === PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK);
  if (allSent) {
    await WashingTransfer.updateOne(
      { _id: batch.washingTransferId },
      { $set: { status: WASHING_TRANSFER_STATUS.RETURNED } }
    );
  }

  const batchesOfJob = await PackingBatch.find({ jobId: batch.jobId });
  const allJobBatchesSent = batchesOfJob.every(
    (b) => b.status === PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK
  );
  if (allJobBatchesSent) {
    const { ManufacturingJob } = await import('../models/index.js');
    const { JOB_STATUS } = await import('../utils/statusMachine.js');
    await ManufacturingJob.updateOne(
      { _id: batch.jobId },
      { $set: { status: JOB_STATUS.PACKING_COMPLETED } }
    );
  }
  return batch.toObject();
}
