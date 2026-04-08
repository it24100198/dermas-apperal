import mongoose from 'mongoose';
import { JOB_STATUS } from '../utils/statusMachine.js';

const manufacturingJobSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true, unique: true },
    materialIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialIssue', default: null },
    styleRef: { type: String, trim: true },
    batchRef: { type: String, trim: true },
    issuedFabricQuantity: { type: Number, required: true },
    accessories: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, required: true, enum: Object.values(JOB_STATUS) },
    issueDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fabricUsedQty: { type: Number, default: null },
    fabricWasteQty: { type: Number, default: null },
    totalCutPieces: { type: Number, default: null },
    cuttingRejectQty: { type: Number, default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  },
  { timestamps: true }
);

manufacturingJobSchema.index({ status: 1 });
manufacturingJobSchema.index({ createdAt: -1 });

export default mongoose.model('ManufacturingJob', manufacturingJobSchema);
