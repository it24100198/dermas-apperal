const express = require("express");

const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustProductStock,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id/stock", adjustProductStock);
router.delete("/:id", deleteProduct);

module.exports = router;
