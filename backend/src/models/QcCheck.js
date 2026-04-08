import mongoose from 'mongoose';

const qcCheckSchema = new mongoose.Schema(
  {
    washingTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'WashingTransfer', required: true },
    totalChecked: { type: Number, required: true },
    finishedGoodQty: { type: Number, required: true },
    damagedQty: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

qcCheckSchema.index({ washingTransferId: 1 }, { unique: true });

export default mongoose.model('QcCheck', qcCheckSchema);
