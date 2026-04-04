import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['fabric', 'accessory', 'etc'] },
    stockQty: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'pcs' },
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);
