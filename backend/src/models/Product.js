import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, unique: true, sparse: true },
    barcode: { type: String, trim: true, default: '' },
    image: { type: String, default: '' }, // stored filename

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBrand', default: null },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit', default: null },

    productType: {
      type: String,
      enum: ['finished', 'semi_finished', 'raw_linked', 'service'],
      default: 'finished',
    },

    // Manufacturing cost breakdown
    materialCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    overheadCost: { type: Number, default: 0 },
    packagingCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    totalManufacturingCost: { type: Number, default: 0 }, // auto-calculated

    sellingPrice: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },   // auto-calculated
    profitMargin: { type: Number, default: 0 },   // auto-calculated (%)

    // Stock
    stockQty: { type: Number, default: 0 },
    openingStock: { type: Number, default: 0 },
    alertQuantity: { type: Number, default: 5 },
    manageStock: { type: Boolean, default: true },
    trackStock: { type: Boolean, default: true },

    // Production related
    bomReference: { type: String, default: '' },
    batchNumberSupport: { type: Boolean, default: false },
    estimatedProductionTime: { type: String, default: '' },
    reorderLevel: { type: Number, default: 0 },
    weight: { type: Number, default: null },
    size: { type: String, default: '' },

    // Other
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
    classification: { type: String, enum: ['normal', 'damage'], default: 'normal' },
    /** For damage SKUs: link to the main finished-good product */
    linkedGoodProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    featured: { type: Boolean, default: false },
    allowDiscount: { type: Boolean, default: true },
    expirySupport: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-calculate costs before save
productSchema.pre('save', function (next) {
  this.totalManufacturingCost =
    (this.materialCost || 0) +
    (this.laborCost || 0) +
    (this.overheadCost || 0) +
    (this.packagingCost || 0) +
    (this.otherCost || 0);
  this.profitAmount = (this.sellingPrice || 0) - this.totalManufacturingCost;
  this.profitMargin =
    this.sellingPrice > 0
      ? Math.round(((this.profitAmount / this.sellingPrice) * 100) * 100) / 100
      : 0;
  next();
});

export default mongoose.model('Product', productSchema);
