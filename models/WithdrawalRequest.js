const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Completed"],
    default: "Pending"
  },
  adminNote: String,
  transactionId: String, // Bank Ref No
  processedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
