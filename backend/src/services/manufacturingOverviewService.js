import {
  ManufacturingJob,
  WashingTransfer,
  PackingBatch,
} from '../models/index.js';
import { JOB_STATUS } from '../utils/statusMachine.js';
import { WASHING_TRANSFER_STATUS } from '../utils/statusMachine.js';

export async function getOverview() {
  const [
    totalJobs,
    fabricCutting,
    lineAssigned,
    washing,
    afterWashPacking,
    warehouse,
    recentJobs,
  ] = await Promise.all([
    ManufacturingJob.countDocuments(),
    ManufacturingJob.countDocuments({
      status: { $in: [JOB_STATUS.FABRIC_ISSUED, JOB_STATUS.SENT_TO_CUTTING, JOB_STATUS.CUTTING_COMPLETED] },
    }),
    ManufacturingJob.countDocuments({
      status: { $in: [JOB_STATUS.LINE_ASSIGNED, JOB_STATUS.LINE_IN_PROGRESS, JOB_STATUS.LINE_COMPLETED] },
    }),
    ManufacturingJob.countDocuments({ status: JOB_STATUS.WASHING_OUT }),
    ManufacturingJob.countDocuments({
      status: { $in: [JOB_STATUS.AFTER_WASH_RECEIVED, JOB_STATUS.PACKING_COMPLETED] },
    }),
    ManufacturingJob.countDocuments({ status: JOB_STATUS.WAREHOUSE_RECEIVED }),
    ManufacturingJob.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('productId', 'name sku')
      .lean(),
  ]);

  return {
    kpis: {
      totalJobs,
      fabricCutting,
      lineAssigned,
      washing,
      afterWashPacking,
      warehouse,
    },
    recentJobs,
  };
}
