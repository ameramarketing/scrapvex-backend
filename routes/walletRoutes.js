const express = require("express");
const router = express.Router();
const { getWalletInfo, initiateRecharge, requestWithdrawal, generateWithdrawalOTP, cancelWithdrawal, initiateDeposit } = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

router.get("/info", protect, getWalletInfo);
router.post("/recharge", protect, initiateRecharge);
router.post("/withdraw/otp", protect, generateWithdrawalOTP);
router.post("/withdraw", protect, requestWithdrawal);
router.post("/withdraw/cancel/:id", protect, cancelWithdrawal);
router.post("/deposit", protect, initiateDeposit);

module.exports = router;
