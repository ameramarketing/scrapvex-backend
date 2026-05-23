const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "paid_in_cash"],
    default: "pending"
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ["pickup", "recharge", "withdrawal", "refund", "transfer", "commission", "deposit", "purchase", "sale", "settlement"],
    required: true
  },
  pickupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pickup"
  },
  withdrawalDetails: {
    upiId: String,
    accountHolderName: String
  },
  rechargeDetails: {
    mobileNumber: String,
    operator: String,
    plan: String,
    apiResponse: Object
  },
  depositDetails: {
    upiRefNo: String
  }
}, { timestamps: true });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
