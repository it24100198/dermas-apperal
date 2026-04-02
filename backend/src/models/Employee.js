import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productionSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionSection', default: null },
    role: {
      type: String,
      enum: ['line_supervisor', 'washing_supervisor', 'cutting_supervisor', 'admin', 'operator'],
      default: 'operator',
    },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

employeeSchema.index({ userId: 1 }, { unique: true });
employeeSchema.index({ productionSectionId: 1 });

export default mongoose.model('Employee', employeeSchema);
