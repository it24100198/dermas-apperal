import { Product, ProductCategory, ProductBrand, ProductUnit } from '../models/index.js';

function calcCosts(data) {
  const totalManufacturingCost =
    (Number(data.materialCost) || 0) +
    (Number(data.laborCost) || 0) +
    (Number(data.overheadCost) || 0) +
    (Number(data.packagingCost) || 0) +
    (Number(data.otherCost) || 0);
  const sellingPrice = Number(data.sellingPrice) || 0;
  const profitAmount = sellingPrice - totalManufacturingCost;
  const profitMargin =
    sellingPrice > 0 ? Math.round(((profitAmount / sellingPrice) * 100) * 100) / 100 : 0;
  return { totalManufacturingCost, profitAmount, profitMargin };
}

function generateSku() {
  const prefix = 'MFG';
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${ts}-${rand}`;
}

export async function listProducts(filters = {}) {
  const query = {};

  if (filters.search) {
    const re = new RegExp(filters.search, 'i');
    query.$or = [{ name: re }, { sku: re }, { barcode: re }];
  }
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.brandId) query.brandId = filters.brandId;
  if (filters.status) query.status = filters.status;
  if (filters.stockStatus === 'low') query.$expr = { $lte: ['$stockQty', '$alertQuantity'] };
  if (filters.stockStatus === 'out') query.stockQty = 0;
  if (filters.productType) query.productType = filters.productType;
  if (filters.classification === 'normal' || filters.classification === 'damage') {
    query.classification = filters.classification;
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Number(filters.limit) || 25);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .populate('unitId', 'name abbreviation')
      .populate('linkedGoodProductId', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return { products, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProduct(productId) {
  const product = await Product.findById(productId)
    .populate('categoryId', 'name')
    .populate('brandId', 'name')
    .populate('unitId', 'name abbreviation')
    .lean();
  if (!product) throw new Error('Product not found');
  return product;
}

export async function createProduct(data) {
  if (!data.sku) data.sku = generateSku();

  const existing = await Product.findOne({ sku: data.sku });
  if (existing) throw new Error(`SKU "${data.sku}" already exists`);

  const costs = calcCosts(data);
  const product = await Product.create({ ...data, ...costs });
  return product.toObject();
}

export async function updateProduct(productId, data) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  if (data.sku && data.sku !== product.sku) {
    const existing = await Product.findOne({ sku: data.sku, _id: { $ne: productId } });
    if (existing) throw new Error(`SKU "${data.sku}" already in use`);
  }

  const costs = calcCosts({ ...product.toObject(), ...data });
  Object.assign(product, data, costs);
  await product.save();
  return product.toObject();
}

export async function deleteProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  await product.deleteOne();
  return { ok: true };
}

export async function getDashboardSummary() {
  const [total, active, outOfStock, lowStock] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ stockQty: 0 }),
    Product.countDocuments({ $expr: { $and: [{ $gt: ['$stockQty', 0] }, { $lte: ['$stockQty', '$alertQuantity'] }] } }),
  ]);
  const highProfit = await Product.find({ status: 'active' })
    .sort({ profitMargin: -1 })
    .limit(5)
    .select('name sku profitMargin sellingPrice stockQty')
    .lean();
  return { total, active, outOfStock, lowStock, highProfit };
}

// ── Category / Brand / Unit helpers ──────────────────────────────────────────

export async function listCategories() {
  return ProductCategory.find().sort({ name: 1 }).lean();
}
export async function createCategory(data) {
  return (await ProductCategory.create(data)).toObject();
}
export async function updateCategory(id, data) {
  const c = await ProductCategory.findByIdAndUpdate(id, data, { new: true });
  if (!c) throw new Error('Category not found');
  return c.toObject();
}
export async function deleteCategory(id) {
  await ProductCategory.findByIdAndDelete(id);
  return { ok: true };
}

export async function listBrands() {
  return ProductBrand.find().sort({ name: 1 }).lean();
}
export async function createBrand(data) {
  return (await ProductBrand.create(data)).toObject();
}
export async function updateBrand(id, data) {
  const b = await ProductBrand.findByIdAndUpdate(id, data, { new: true });
  if (!b) throw new Error('Brand not found');
  return b.toObject();
}
export async function deleteBrand(id) {
  await ProductBrand.findByIdAndDelete(id);
  return { ok: true };
}

export async function listUnits() {
  return ProductUnit.find().sort({ name: 1 }).lean();
}
export async function createUnit(data) {
  return (await ProductUnit.create(data)).toObject();
}
export async function updateUnit(id, data) {
  const u = await ProductUnit.findByIdAndUpdate(id, data, { new: true });
  if (!u) throw new Error('Unit not found');
  return u.toObject();
}
export async function deleteUnit(id) {
  await ProductUnit.findByIdAndDelete(id);
  return { ok: true };
}

// Called from Final Checking when a batch is finalized → add to product stock
export async function addStockFromFinalCheck(productId, qty) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');
  product.stockQty = (product.stockQty || 0) + qty;
  await product.save();
  return product.toObject();
}
