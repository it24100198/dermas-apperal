import * as productService from '../services/productService.js';

// ── Products ──────────────────────────────────────────────────────────────────

export async function listProducts(req, res) {
  try {
    const result = await productService.listProducts(req.query);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await productService.getProduct(req.params.id);
    return res.json(product);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.json(product);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getDashboardSummary(req, res) {
  try {
    const data = await productService.getDashboardSummary();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(req, res) {
  try { return res.json(await productService.listCategories()); }
  catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function createCategory(req, res) {
  try { return res.status(201).json(await productService.createCategory(req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function updateCategory(req, res) {
  try { return res.json(await productService.updateCategory(req.params.id, req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function deleteCategory(req, res) {
  try { return res.json(await productService.deleteCategory(req.params.id)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}

// ── Brands ────────────────────────────────────────────────────────────────────

export async function listBrands(req, res) {
  try { return res.json(await productService.listBrands()); }
  catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function createBrand(req, res) {
  try { return res.status(201).json(await productService.createBrand(req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function updateBrand(req, res) {
  try { return res.json(await productService.updateBrand(req.params.id, req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function deleteBrand(req, res) {
  try { return res.json(await productService.deleteBrand(req.params.id)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}

// ── Units ─────────────────────────────────────────────────────────────────────

export async function listUnits(req, res) {
  try { return res.json(await productService.listUnits()); }
  catch (err) { return res.status(500).json({ error: err.message }); }
}
export async function createUnit(req, res) {
  try { return res.status(201).json(await productService.createUnit(req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function updateUnit(req, res) {
  try { return res.json(await productService.updateUnit(req.params.id, req.body)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
export async function deleteUnit(req, res) {
  try { return res.json(await productService.deleteUnit(req.params.id)); }
  catch (err) { return res.status(400).json({ error: err.message }); }
}
