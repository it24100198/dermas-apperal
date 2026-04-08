import mongoose from 'mongoose';
import { PACKING_BATCH_STATUS, PACKING_BATCH_TYPE } from '../utils/statusMachine.js';

const packingBatchSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingJob', required: true },
    washingTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'WashingTransfer', default: null },
    type: { type: String, required: true, enum: Object.values(PACKING_BATCH_TYPE) },
    quantity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: Object.values(PACKING_BATCH_STATUS),
      default: PACKING_BATCH_STATUS.PACKING,
    },
  },
  { timestamps: true }
);

packingBatchSchema.index({ jobId: 1 });
packingBatchSchema.index({ washingTransferId: 1 });
packingBatchSchema.index({ status: 1 });

export default mongoose.model('PackingBatch', packingBatchSchema);
