import mongoose from 'mongoose';

const materialCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['fabric', 'accessory', 'packaging', 'thread', 'chemical', 'other'],
      default: 'other',
    },
    uom: {
      type: String,
      enum: ['meters', 'kg', 'pcs', 'rolls', 'liters', 'boxes'],
      default: 'pcs',
    },
    reorderLevel: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 }, // last known price
    preferredSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  },
  { timestamps: true }
);

materialCatalogSchema.index({ name: 1 });
materialCatalogSchema.index({ category: 1 });

export default mongoose.model('MaterialCatalog', materialCatalogSchema);
