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

const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  if (req.query.type) {
    const normalizedType = String(req.query.type).toLowerCase();
    if (!["in", "out"].includes(normalizedType)) {
      throw new ApiError(400, "type must be either 'in' or 'out'.");
    }
    filter.type = normalizedType;
  }

  if (req.query.productId) {
    ensureObjectId(req.query.productId, "productId");
    filter.product = req.query.productId;
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};

    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      if (Number.isNaN(startDate.getTime())) {
        throw new ApiError(400, "Invalid startDate.");
      }
      filter.date.$gte = startDate;
    }

    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      if (Number.isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid endDate.");
      }
      filter.date.$lte = endDate;
    }
  }

  const [transactions, totalItems] = await Promise.all([
    Transaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: transactions,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
  });
});

const createTransaction = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const { product, transaction } = await applyStockTransaction({
    productId: payload.productId,
    type: payload.type,
    quantity: payload.quantity,
    notes: payload.notes,
  });

  res.status(201).json({
    success: true,
    message: "Transaction created successfully.",
    data: {
      product,
      transaction,
    },
  });
});

module.exports = {
  listTransactions,
  createTransaction,
};
