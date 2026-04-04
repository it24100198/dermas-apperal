import mongoose from 'mongoose';

const recipeLineSchema = new mongoose.Schema(
  {
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    /** Quantity of this material per one finished good piece */
    quantityPerUnit: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const productRecipeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    lines: [recipeLineSchema],
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ProductRecipe', productRecipeSchema);
