import { ProductRecipe, Product, Material } from '../models/index.js';

export async function listRecipes() {
  const recipes = await ProductRecipe.find()
    .populate('productId', 'name sku classification')
    .populate('lines.materialId', 'name type unit')
    .sort({ updatedAt: -1 })
    .lean();
  return recipes;
}

export async function getRecipeByProductId(productId) {
  const recipe = await ProductRecipe.findOne({ productId })
    .populate('lines.materialId', 'name type unit stockQty unitPrice')
    .lean();
  return recipe;
}

export async function upsertRecipe(productId, data) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  if (product.classification !== 'normal') throw new Error('Recipes can only be set for normal (finished) products');

  const lines = (data.lines || [])
    .filter((l) => l.materialId && Number(l.quantityPerUnit) > 0)
    .map((l) => ({
      materialId: l.materialId,
      quantityPerUnit: Number(l.quantityPerUnit),
    }));

  if (lines.length === 0) {
    await ProductRecipe.deleteOne({ productId });
    return { productId, lines: [], note: '', cleared: true };
  }

  for (const line of lines) {
    const mat = await Material.findById(line.materialId);
    if (!mat) throw new Error(`Material not found: ${line.materialId}`);
  }

  const recipe = await ProductRecipe.findOneAndUpdate(
    { productId },
    {
      $set: {
        lines,
        note: data.note || '',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return recipe.toObject();
}

export async function deleteRecipe(productId) {
  await ProductRecipe.deleteOne({ productId });
  return { ok: true };
}
