const express = require("express");

const {
  listTransactions,
  createTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", listTransactions);
router.post("/", createTransaction);

module.exports = router;
