const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const axios = require("axios");
const { sendWhatsAppOTP } = require("../utils/whatsapp");

// Get Wallet Balance and Transactions
const getWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance pendingBalance");
    const transactions = await WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      balance: user.walletBalance,
      pendingBalance: user.pendingBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initiate Recharge
const initiateRecharge = async (req, res) => {
  try {
    const { mobileNumber, operator, plan, amount } = req.body;
    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Create a pending debit transaction first
    const transaction = await WalletTransaction.create({
      user: user._id,
      amount: amount,
      type: "debit",
      status: "pending",
      description: `Mobile Recharge: ${mobileNumber} (${operator})`,
      source: "recharge",
      rechargeDetails: { mobileNumber, operator, plan }
    });

    // Deduct from wallet immediately to prevent double spending
    user.walletBalance -= amount;
    await user.save();

    // HIT EXTERNAL RECHARGE API (Your friend's API)
    // Replace with actual API details later
    /*
    try {
      const response = await axios.post("YOUR_FRIEND_API_URL", {
        api_key: "YOUR_API_KEY",
        mobile: mobileNumber,
        operator: operator,
        amount: amount,
        callback_url: "YOUR_BACKEND_URL/api/wallet/recharge-callback"
      });

      if (response.data.status === "success") {
        transaction.status = "completed";
        transaction.rechargeDetails.apiResponse = response.data;
        await transaction.save();
        return res.status(200).json({ success: true, message: "Recharge successful", transaction });
      } else {
        // Refund if failed
        user.walletBalance += amount;
        await user.save();
        transaction.status = "failed";
        await transaction.save();
        return res.status(400).json({ success: false, message: "Recharge failed from provider" });
      }
    } catch (apiError) {
      // Refund on connection error
      user.walletBalance += amount;
      await user.save();
      transaction.status = "failed";
      await transaction.save();
      return res.status(500).json({ success: false, message: "API connection error" });
    }
    */

    // FOR DEMO: Mark as completed
    transaction.status = "completed";
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Recharge successful (Demo Mode)",
      transaction
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate OTP for Wallet Withdrawal
const generateWithdrawalOTP = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const user = await User.findById(req.user._id);

    if (amount < 100) {
      return res.status(400).json({ success: false, message: "Minimum withdrawal ₹100" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save to user object
    user.withdrawalOTP = otp;
    user.withdrawalOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    console.log(`[SECURITY OTP] Wallet Withdrawal OTP for ${user.mobile} is: ${otp}`);

    // DISPATCH WHATSAPP OTP TO USER!
    const waText = `🟢 *ScrapVex Wallet Withdrawal OTP*\n\nDear *${user.name || 'User'}*,\nYour 4-Digit OTP to withdraw ₹${amount} from your ScrapVex Wallet to UPI (*${upiId || 'UPI Account'}*) is: *${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
    try {
      await sendWhatsAppOTP(user.mobile, waText);
    } catch (e) {
      console.error("Failed to send WhatsApp OTP for withdrawal:", e.message);
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to your WhatsApp (+91 ${user.mobile}) 💬`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request Withdrawal (UPI)
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, upiId, name, otp } = req.body;
    const user = await User.findById(req.user._id);

    if (amount < 100) {
      return res.status(400).json({ success: false, message: "Minimum withdrawal ₹100" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Verify OTP
    if (!otp || user.withdrawalOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired security OTP" });
    }

    if (user.withdrawalOTPExpires && new Date() > user.withdrawalOTPExpires) {
      return res.status(400).json({ success: false, message: "Security OTP has expired" });
    }

    // Clear OTP after successful verification
    user.withdrawalOTP = "";
    user.withdrawalOTPExpires = null;

    // Deduct balance and create pending withdrawal
    user.walletBalance -= amount;
    await user.save();

    const transaction = await WalletTransaction.create({
      user: user._id,
      amount: amount,
      type: "debit",
      status: "pending",
      description: `UPI Withdrawal to ${upiId}`,
      source: "withdrawal",
      withdrawalDetails: { upiId, accountHolderName: name }
    });

    const withdrawal = await WithdrawalRequest.create({
      user: user._id,
      amount: amount,
      bankDetails: {
        upiId: upiId,
        accountName: name
      },
      status: "Pending"
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted. It will be processed within 24 hours.",
      transaction,
      withdrawal
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Withdrawal Request
const cancelWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find WalletTransaction first
    const tx = await WalletTransaction.findOne({ _id: id, user: req.user._id, source: "withdrawal", status: "pending" });
    if (!tx) {
      return res.status(404).json({ success: false, message: "Pending withdrawal transaction not found" });
    }
    
    // Find matching WithdrawalRequest
    const withdrawal = await WithdrawalRequest.findOne({ 
      user: req.user._id, 
      amount: tx.amount, 
      status: "Pending" 
    });
    
    if (withdrawal) {
      withdrawal.status = "Rejected";
      withdrawal.adminNote = "Cancelled by user";
      await withdrawal.save();
    }
    
    // Refund the amount to user's wallet
    const user = await User.findById(req.user._id);
    user.walletBalance += tx.amount;
    await user.save();
    
    // Update WalletTransaction to failed
    tx.status = "failed";
    tx.description = "Withdrawal Cancelled & Refunded";
    await tx.save();
    
    res.status(200).json({
      success: true,
      message: "Withdrawal request cancelled successfully and amount refunded to your wallet."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initiate Custom UPI Deposit
const initiateDeposit = async (req, res) => {
  try {
    const { amount, upiRefNo } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid deposit amount" });
    }
    if (!upiRefNo || upiRefNo.replace(/\D/g, "").length !== 12) {
      return res.status(400).json({ success: false, message: "Please enter a valid 12-digit UPI Reference Number / UTR" });
    }

    // Check duplicate
    const existingTx = await WalletTransaction.findOne({ "depositDetails.upiRefNo": upiRefNo });
    if (existingTx) {
      return res.status(400).json({ success: false, message: "This UPI Reference Number has already been submitted!" });
    }

    // Create pending credit transaction
    const transaction = await WalletTransaction.create({
      user: req.user._id,
      amount: Number(amount),
      type: "credit",
      status: "pending",
      description: `Wallet Deposit (UPI Ref: ${upiRefNo})`,
      source: "deposit",
      depositDetails: { upiRefNo }
    });

    res.status(200).json({
      success: true,
      message: "Deposit request submitted successfully! Admin will verify and credit your wallet shortly. 🏦",
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWalletInfo,
  initiateRecharge,
  requestWithdrawal,
  generateWithdrawalOTP,
  cancelWithdrawal,
  initiateDeposit
};
