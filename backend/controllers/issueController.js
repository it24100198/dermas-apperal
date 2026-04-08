const IssuanceRecord = require("../models/IssuanceRecord");
const Product = require("../models/Product");

const issueController = {
  createIssuance: async (req, res, next) => {
    try {
      const { productId, quantity, issuedTo, issuedBy, purpose, notes } = req.body;

      if (!productId || !quantity || !issuedTo || !issuedBy || !purpose) {
        return res.status(400).json({ error: "Please provide all required fields." });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      if (product.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient stock available." });
      }

      const issuance = await IssuanceRecord.create({
        productId,
        productName: product.name,
        quantity,
        issuedTo,
        issuedBy,
        purpose,
        notes,
      });

      product.quantity -= quantity;
      await product.save();

      res.status(201).json({
        data: issuance,
      });
    } catch (err) {
      next(err);
    }
  },

  listIssuances: async (req, res, next) => {
    try {
      const issuances = await IssuanceRecord.find().sort({ createdAt: -1 });

      res.status(200).json({
        data: issuances,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = issueController;
