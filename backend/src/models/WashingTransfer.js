import mongoose from 'mongoose';
import { WASHING_TRANSFER_STATUS } from '../utils/statusMachine.js';

const washingTransferSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingJob', default: null },
    quantitySent: { type: Number, required: true },
    sentFrom: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(WASHING_TRANSFER_STATUS),
      default: WASHING_TRANSFER_STATUS.PENDING,
    },
    quantityReturned: { type: Number, default: null },
  },
  { timestamps: true }
);

washingTransferSchema.index({ jobId: 1 });
washingTransferSchema.index({ status: 1 });

export default mongoose.model('WashingTransfer', washingTransferSchema);
