const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  applyStockTransaction,
  ensureObjectId,
} = require("../services/inventoryService");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseSort = (query, allowedFields, fallbackField) => {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : fallbackField;
  const order = query.order === "asc" ? 1 : -1;
  return { [sortBy]: order };
};

const buildProductPayload = (payload, { partial }) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const nextPayload = {};

  const addTextField = (field, label) => {
    if (payload[field] === undefined) {
      if (!partial) {
        throw new ApiError(400, `${label} is required.`);
      }
      return;
    }

    const value = String(payload[field]).trim();
    if (!value) {
      throw new ApiError(400, `${label} cannot be empty.`);
    }
    nextPayload[field] = value;
  };

  addTextField("name", "Name");
  addTextField("category", "Category");
  addTextField("size", "Size");
  addTextField("color", "Color");

  if (payload.price !== undefined || !partial) {
    const parsedPrice = Number(payload.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new ApiError(400, "Price must be a non-negative number.");
    }
    nextPayload.price = parsedPrice;
  }

  if (payload.quantity !== undefined || !partial) {
    const parsedQuantity = Number(payload.quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      throw new ApiError(400, "Quantity must be a non-negative integer.");
    }
    nextPayload.quantity = parsedQuantity;
  }

  if (payload.description !== undefined) {
    nextPayload.description = String(payload.description).trim();
  } else if (!partial) {
    nextPayload.description = "";
  }

  if (partial && Object.keys(nextPayload).length === 0) {
    throw new ApiError(400, "At least one valid field is required for update.");
  }

  return nextPayload;
};

const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(
    req.query,
    ["name", "category", "price", "quantity", "createdAt", "updatedAt"],
    "createdAt"
  );

  const filter = {};

  if (req.query.search) {
    const searchTerm = escapeRegex(req.query.search.trim());
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { color: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (req.query.category) {
    filter.category = { $regex: `^${escapeRegex(req.query.category.trim())}$`, $options: "i" };
  }

  if (req.query.stockStatus === "out") {
    filter.quantity = 0;
  } else if (req.query.stockStatus === "low") {
    filter.quantity = { $gt: 0, $lte: 10 };
  } else if (req.query.stockStatus === "in") {
    filter.quantity = { $gt: 0 };
  }

  const [products, totalItems] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const payload = buildProductPayload(req.body, { partial: false });
  const product = await Product.create(payload);

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);

  const payload = buildProductPayload(req.body, { partial: true });
  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    data: product,
  });
});

const adjustProductStock = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  const { product, transaction } = await applyStockTransaction({
    productId: req.params.id,
    type: payload.type,
    quantity: payload.quantity,
    notes: payload.notes,
  });

  res.status(200).json({
    success: true,
    message: "Stock updated successfully.",
    data: {
      product,
      transaction,
    },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const deletionResult = await Transaction.deleteMany({ product: req.params.id });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
    meta: {
      deletedTransactions: deletionResult.deletedCount || 0,
    },
  });
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustProductStock,
  deleteProduct,
};
