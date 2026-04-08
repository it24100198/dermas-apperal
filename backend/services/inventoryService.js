const mongoose = require("mongoose");

const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

const ensureObjectId = (value, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const ensurePositiveInteger = (value, fieldName = "quantity") => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer.`);
  }

  return parsedValue;
};

const applyStockTransaction = async ({ productId, type, quantity, notes = "" }) => {
  ensureObjectId(productId, "productId");

  const normalizedType = String(type || "").toLowerCase();
  if (!["in", "out"].includes(normalizedType)) {
    throw new ApiError(400, "Transaction type must be either 'in' or 'out'.");
  }

  const normalizedQuantity = ensurePositiveInteger(quantity);
  const normalizedNotes = typeof notes === "string" ? notes.trim() : "";

  let product;

  if (normalizedType === "in") {
    product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { quantity: normalizedQuantity } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found.");
    }
  } else {
    product = await Product.findOneAndUpdate(
      { _id: productId, quantity: { $gte: normalizedQuantity } },
      { $inc: { quantity: -normalizedQuantity } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const existingProduct = await Product.findById(productId);

      if (!existingProduct) {
        throw new ApiError(404, "Product not found.");
      }

      throw new ApiError(
        400,
        `Insufficient stock. Available quantity is ${existingProduct.quantity}.`
      );
    }
  }

  const transaction = await Transaction.create({
    product: product._id,
    productName: product.name,
    type: normalizedType,
    quantity: normalizedQuantity,
    notes: normalizedNotes,
    date: new Date(),
  });

  return { product, transaction };
};

module.exports = {
  applyStockTransaction,
  ensureObjectId,
  ensurePositiveInteger,
};
