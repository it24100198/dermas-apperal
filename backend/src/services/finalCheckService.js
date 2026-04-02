import {
  PackingBatch,
  ManufacturingJob,
  Product,
  StockLedger,
  MaterialIssue,
  Material,
} from '../models/index.js';
import { PACKING_BATCH_STATUS, PACKING_BATCH_TYPE, JOB_STATUS } from '../utils/statusMachine.js';
import { withTransaction } from '../utils/withTransaction.js';

export async function listFinalJobs() {
  const batchIds = await PackingBatch.distinct('jobId', {
    status: PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK,
  });
  const jobs = await ManufacturingJob.find({ _id: { $in: batchIds } })
    .populate('productId', 'name sku')
    .sort({ updatedAt: -1 })
    .lean();

  // Attach pending batch counts
  const counts = await PackingBatch.aggregate([
    { $match: { jobId: { $in: batchIds }, status: PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK } },
    { $group: { _id: '$jobId', pendingCount: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[String(c._id)] = c; });

  return jobs.map((j) => ({
    ...j,
    pendingCount: countMap[String(j._id)]?.pendingCount ?? 0,
    pendingQty: countMap[String(j._id)]?.totalQty ?? 0,
  }));
}

export async function getFinalJobDetail(jobId) {
  const job = await ManufacturingJob.findById(jobId).populate('productId').lean();
  if (!job) throw new Error('Job not found');

  const batches = await PackingBatch.find({
    jobId,
    status: { $in: [PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK, PACKING_BATCH_STATUS.COMPLETED] },
  }).lean();

  // --- Material cost calculation ---
  // All material issues for this job
  const issues = await MaterialIssue.find({ jobId }).populate('materialId', 'name unit unitPrice').lean();

  const materialBreakdown = [];
  const materialMap = {};
  for (const issue of issues) {
    const mat = issue.materialId;
    if (!mat) continue;
    const id = String(mat._id);
    const unitPrice = mat.unitPrice || 0;
    const lineTotal = unitPrice * issue.quantityIssued;
    if (materialMap[id]) {
      materialMap[id].qtyIssued += issue.quantityIssued;
      materialMap[id].totalCost += lineTotal;
    } else {
      materialMap[id] = {
        materialId: id,
        name: mat.name,
        unit: mat.unit,
        unitPrice,
        qtyIssued: issue.quantityIssued,
        totalCost: lineTotal,
      };
    }
  }
  Object.values(materialMap).forEach((m) => materialBreakdown.push(m));

  const totalMaterialCost = materialBreakdown.reduce((s, m) => s + m.totalCost, 0);

  // Produced good pcs: sum of completed+pending GOOD batches
  const goodBatches = batches.filter((b) => b.type === PACKING_BATCH_TYPE.GOOD);
  const totalGoodPcs = goodBatches.reduce((s, b) => s + b.quantity, 0);

  // Total produced pcs (good + damage) from QC batches
  const allBatchesForJob = await PackingBatch.find({ jobId }).lean();
  const totalProducedPcs = allBatchesForJob.reduce((s, b) => s + b.quantity, 0);

  const costPerPieceGood = totalGoodPcs > 0 ? totalMaterialCost / totalGoodPcs : 0;
  const costPerPieceAll = totalProducedPcs > 0 ? totalMaterialCost / totalProducedPcs : 0;

  return {
    job,
    batches,
    costSummary: {
      materialBreakdown,
      totalMaterialCost,
      totalGoodPcs,
      totalProducedPcs,
      costPerPieceGood,
      costPerPieceAll,
    },
  };
}

export async function finalizeBatch(batchId, userId) {
  const batch = await PackingBatch.findById(batchId)
    .populate('jobId')
    .lean();
  if (!batch) throw new Error('Batch not found');
  if (batch.status !== PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK) {
    throw new Error('Batch must be sent_to_final_check to finalize');
  }
  const job = batch.jobId;
  const product = await Product.findById(job.productId);
  if (!product) throw new Error('Job product not found');

  return withTransaction(async (session) => {
    const opts = { session };
    await PackingBatch.updateOne(
      { _id: batchId },
      { $set: { status: PACKING_BATCH_STATUS.COMPLETED } },
      opts
    );

    if (batch.type === PACKING_BATCH_TYPE.GOOD) {
      await StockLedger.create(
        [
          {
            productId: product._id,
            transactionType: 'transfer_in',
            quantity: batch.quantity,
            referenceType: 'ManufacturingJob',
            referenceId: job._id,
            notes: `Final check - good batch`,
            createdBy: userId,
          },
        ],
        opts
      );
      await Product.updateOne(
        { _id: product._id },
        { $set: { status: 'draft' }, $inc: { stockQty: batch.quantity } },
        opts
      );
    } else {
      let damageProduct = await Product.findOne(
        { classification: 'damage', name: `Damage - ${product.name}` },
        null,
        { session }
      );
      if (!damageProduct) {
        const [created] = await Product.create(
          [
            {
              name: `Damage - ${product.name}`,
              sku: product.sku ? `DAM-${product.sku}` : undefined,
              classification: 'damage',
              status: 'draft',
              stockQty: batch.quantity,
            },
          ],
          opts
        );
        damageProduct = created;
      } else {
        await Product.updateOne(
          { _id: damageProduct._id },
          { $inc: { stockQty: batch.quantity } },
          opts
        );
      }
      await StockLedger.create(
        [
          {
            productId: damageProduct._id,
            transactionType: 'transfer_in',
            quantity: batch.quantity,
            referenceType: 'ManufacturingJob',
            referenceId: job._id,
            notes: `Final check - damage batch`,
            createdBy: userId,
          },
        ],
        opts
      );
    }

    const allBatches = await PackingBatch.find({ jobId: job._id }).session(session);
    const allCompleted = allBatches.every((b) => b.status === PACKING_BATCH_STATUS.COMPLETED);
    if (allCompleted) {
      await ManufacturingJob.updateOne(
        { _id: job._id },
        { $set: { status: JOB_STATUS.WAREHOUSE_RECEIVED } },
        opts
      );
    }
    return { ok: true, jobStatus: allCompleted ? JOB_STATUS.WAREHOUSE_RECEIVED : null };
  });
}
