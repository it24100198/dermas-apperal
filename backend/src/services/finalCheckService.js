import {
  PackingBatch,
  ManufacturingJob,
  Product,
  StockLedger,
  MaterialIssue,
  Material,
  ProductRecipe,
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

  let recipe = null;
  if (job.productId?._id) {
    recipe = await ProductRecipe.findOne({ productId: job.productId._id })
      .populate('lines.materialId', 'name type unit stockQty')
      .lean();
  }

  return {
    job,
    batches,
    recipe,
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
            notes: `Final check - good batch (${batch.quantity} pcs from job ${job.jobNumber || ''})`,
            createdBy: userId,
          },
        ],
        opts
      );
      // Increment stock; keep status as-is (don't downgrade active → draft)
      const updateFields = { $inc: { stockQty: batch.quantity } };
      if (product.status === 'draft') updateFields.$set = { status: 'active' };
      await Product.updateOne({ _id: product._id }, updateFields, opts);

      // Auto-consume recipe accessories (per finished good piece × batch qty)
      const recipe = await ProductRecipe.findOne({ productId: job.productId }).session(session).lean();
      if (recipe?.lines?.length) {
        for (const line of recipe.lines) {
          const need = Number(line.quantityPerUnit) * batch.quantity;
          if (need <= 0) continue;
          const mat = await Material.findById(line.materialId).session(session);
          if (!mat) throw new Error(`Recipe material missing: ${line.materialId}`);
          if (mat.stockQty < need) {
            throw new Error(
              `Insufficient stock for recipe: ${mat.name}. Need ${need} ${mat.unit || 'pcs'}, available ${mat.stockQty}. Add stock or adjust recipe.`
            );
          }
        }
        for (const line of recipe.lines) {
          const need = Number(line.quantityPerUnit) * batch.quantity;
          if (need <= 0) continue;
          const matRow = await Material.findById(line.materialId).session(session);
          const unit = matRow?.unit || 'pcs';
          await Material.updateOne({ _id: line.materialId }, { $inc: { stockQty: -need } }, opts);
          await MaterialIssue.create(
            [
              {
                materialId: line.materialId,
                quantityIssued: need,
                issuedTo: `Recipe auto — ${batch.quantity} good pcs × ${line.quantityPerUnit} ${unit}/pc (${matRow?.name || 'material'})`,
                jobId: job._id,
                packingBatchId: batchId,
                issuedBy: userId,
              },
            ],
            opts
          );
        }
      }
    } else {
      let damageProduct = await Product.findOne(
        { linkedGoodProductId: product._id, classification: 'damage' },
        null,
        { session }
      );
      if (!damageProduct) {
        damageProduct = await Product.findOne(
          { classification: 'damage', name: `Damage - ${product.name}` },
          null,
          { session }
        );
      }
      if (!damageProduct) {
        const [created] = await Product.create(
          [
            {
              name: `Damage - ${product.name}`,
              sku: product.sku ? `DAM-${product.sku}` : undefined,
              classification: 'damage',
              linkedGoodProductId: product._id,
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
          {
            $inc: { stockQty: batch.quantity },
            $set: { linkedGoodProductId: product._id },
          },
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
