const WithdrawalRequest = require("../models/WithdrawalRequest");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const getWithdrawals = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "user" || req.user.role === "franchise") query.user = req.user._id;

    const withdrawals = await WithdrawalRequest.find(query)
      .populate("user", "name mobile walletBalance")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, upi, name } = req.body;
    const user = await User.findById(req.user._id);

    if (amount > user.walletBalance) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // 1. Create the Withdrawal Request Record
    const withdrawal = await WithdrawalRequest.create({
      user: req.user._id,
      amount,
      bankDetails: {
        upiId: upi,
        accountName: name
      }
    });

    // 2. Deduct from User Wallet Balance Immediately (to lock funds)
    user.walletBalance -= Number(amount);
    await user.save();

    // 3. Create a Pending Wallet Transaction Record
    await WalletTransaction.create({
      user: user._id,
      amount: Number(amount),
      type: "debit",
      status: "pending",
      description: `Withdrawal request to ${upi}`,
      source: "withdrawal"
    });

    // 4. Notify Super Admins
    const admins = await User.find({ role: "admin" });
    const { createNotify } = require("./notificationController");
    admins.forEach(admin => {
      createNotify(admin._id, "User", "New Payout Request", `${user.name} requested ₹${amount} withdrawal`, "info");
    });

    res.status(201).json({ success: true, message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const processWithdrawal = async (req, res) => {
  try {
    const { status, adminNote, transactionId } = req.body;
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: "Not found" });

    if (status === "Completed") {
      // Find the pending transaction and mark it completed
      const transaction = await WalletTransaction.findOne({
        user: withdrawal.user,
        amount: withdrawal.amount,
        type: "debit",
        status: "pending",
        source: "withdrawal"
      }).sort({ createdAt: -1 });

      if (transaction) {
        transaction.status = "completed";
        transaction.description = `Withdrawal to bank (Ref: ${transactionId || "N/A"})`;
        await transaction.save();
      }

      withdrawal.processedAt = new Date();
    } else if (status === "Rejected") {
      // Refund the wallet balance
      const user = await User.findById(withdrawal.user);
      user.walletBalance += withdrawal.amount;
      await user.save();

      // Find the pending transaction and mark it failed
      const transaction = await WalletTransaction.findOne({
        user: withdrawal.user,
        amount: withdrawal.amount,
        type: "debit",
        status: "pending",
        source: "withdrawal"
      }).sort({ createdAt: -1 });

      if (transaction) {
        transaction.status = "failed";
        transaction.description = `Withdrawal Rejected (Refunded)`;
        await transaction.save();
      }
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote || "";
    withdrawal.transactionId = transactionId || "";
    await withdrawal.save();

    // 5. Notify the User
    const { createNotify } = require("./notificationController");
    if (status === "Completed") {
      createNotify(withdrawal.user, "User", "Withdrawal Successful", `Your payout of ₹${withdrawal.amount} has been processed. Ref: ${transactionId || "N/A"}`, "success");
    } else if (status === "Rejected") {
      createNotify(withdrawal.user, "User", "Withdrawal Rejected", `Your payout of ₹${withdrawal.amount} was rejected. Reason: ${adminNote || "N/A"}. Funds refunded.`, "error");
    }

    res.status(200).json({ success: true, message: `Withdrawal ${status}`, withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWithdrawals, requestWithdrawal, processWithdrawal };
