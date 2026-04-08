const express = require("express");
const issueController = require("../controllers/issueController");
const router = express.Router();

router.get("/", issueController.listIssuances);
router.post("/", issueController.createIssuance);

module.exports = router;
