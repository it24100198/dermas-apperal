import {
  PackingBatch,
  ManufacturingJob,
  Product,
  StockLedger,
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
  return jobs;
}

export async function getFinalJobDetail(jobId) {
  const job = await ManufacturingJob.findById(jobId).populate('productId').lean();
  if (!job) throw new Error('Job not found');
  const batches = await PackingBatch.find({
    jobId,
    status: { $in: [PACKING_BATCH_STATUS.SENT_TO_FINAL_CHECK, PACKING_BATCH_STATUS.COMPLETED] },
  }).lean();
  return { job, batches };
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
