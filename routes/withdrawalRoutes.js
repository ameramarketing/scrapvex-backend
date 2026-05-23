const express = require("express");
const router = express.Router();
const { getWithdrawals, requestWithdrawal, processWithdrawal } = require("../controllers/withdrawalController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getWithdrawals);
router.post("/", protect, requestWithdrawal);
router.put("/:id", protect, authorize("admin"), processWithdrawal);

module.exports = router;
