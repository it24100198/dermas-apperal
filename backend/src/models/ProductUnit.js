import mongoose from 'mongoose';

const productUnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    abbreviation: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ProductUnit', productUnitSchema);
