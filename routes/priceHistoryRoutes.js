const express = require("express");
const router = express.Router();
const { getPriceHistory } = require("../controllers/priceHistoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "franchise"), getPriceHistory);

module.exports = router;
