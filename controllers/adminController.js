// controllers/adminController.js

const Pickup = require("../models/Pickup");
const User = require("../models/User");
const ScrapItem = require("../models/ScrapItem");
const CityRate = require("../models/CityRate");
const WalletTransaction = require("../models/WalletTransaction");
const { createNotify } = require("./notificationController");
const { sendWelcomeCredentialsNotification, sendPickupTransactionNotification, sendWalletCreditNotification } = require("../utils/notifier");

/* ===============================
   GET DASHBOARD STATS
================================= */
const getDashboardStats = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "franchise") {
      query.city = { $regex: new RegExp(`^${req.user.assignedCity}$`, "i") };
    }

    const totalUsers = await User.countDocuments();
    const totalPickups = await Pickup.countDocuments({ ...query, status: { $nin: ["Cancelled", "Rejected"] } });
    const pending = await Pickup.countDocuments({ ...query, status: "Pending" });
    const completed = await Pickup.countDocuments({ ...query, status: "Completed" });
    const pickups = await Pickup.find({ ...query, status: "Completed" });
    const revenue = pickups.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalPickups, pending, completed, revenue }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load dashboard stats", error: error.message });
  }
};

/* ===============================
   GET ALL PICKUPS
================================= */
const getAllPickups = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "franchise") {
      query.city = { $regex: new RegExp(`^${req.user.assignedCity}$`, "i") };
    }
    const pickups = await Pickup.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, pickups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch pickups", error: error.message });
  }
};

/* ===============================
   UPDATE PICKUP STATUS
================================= */
const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pickup = await Pickup.findById(id);

    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });

    pickup.status = status;

    if (status === "Completed") {
      const user = await User.findById(pickup.user);
      if (user) {
        const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending" });
        const finalAmount = pickup.amount || 0;
        
        if (transaction) {
          user.pendingBalance -= transaction.amount;
          user.walletBalance += finalAmount;
          transaction.amount = finalAmount;
          transaction.status = "completed";
          transaction.description = `Credit for completed pickup #${pickup._id.toString().slice(-6)}`;
          await transaction.save();
        } else {
          user.walletBalance += finalAmount;
          await WalletTransaction.create({
            user: user._id,
            amount: finalAmount,
            type: "credit",
            status: "completed",
            description: `Credit for completed pickup #${pickup._id.toString().slice(-6)}`,
            source: "pickup",
            pickupId: pickup._id
          });
        }
        await user.save();
      }
    } else if (status === "Cancelled" || status === "Rejected") {
      const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending" });
      if (transaction) {
        const user = await User.findById(pickup.user);
        if (user) {
          user.pendingBalance -= transaction.amount;
          await user.save();
        }
        transaction.status = status.toLowerCase();
        await transaction.save();
      }
    }

    await pickup.save();

    // NOTIFY USER IN-APP + WHATSAPP + SMS
    const statusMsg = status === "Completed" ? `Your pickup for ${pickup.scrapType} is completed. Amount Paid: ₹${pickup.amount || 0}` : `Your pickup status has been updated to: ${status}`;
    createNotify(pickup.user, "User", "Pickup Status Updated", statusMsg, status === "Completed" ? "success" : "info");

    const pickupUser = await User.findById(pickup.user);
    if (pickupUser && pickupUser.mobile) {
      await sendPickupTransactionNotification({
        mobile: pickupUser.mobile,
        name: pickupUser.name,
        pickupId: pickup._id.toString().slice(-6),
        status: status,
        amount: pickup.amount
      });
    }

    res.status(200).json({ success: true, message: "Pickup status updated", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
  }
};

/* ===============================
   ASSIGN PICKUP TO COLLECTOR
================================= */
const assignPickup = async (req, res) => {
  try {
    const { pickupId, collectorId } = req.body;
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });

    const collectorUser = await User.findById(collectorId);
    if (!collectorUser) return res.status(404).json({ success: false, message: "Collector not found" });

    // Franchise restriction: Can only assign to their own collectors
    if (req.user.role === "franchise") {
       const collectorCity = collectorUser.area || collectorUser.assignedCity || "";
       if (collectorCity.toLowerCase() !== req.user.assignedCity.toLowerCase()) {
         return res.status(403).json({ success: false, message: "You can only assign pickups to collectors in your assigned city." });
       }
    }

    pickup.collector = collectorId;
    pickup.status = "Assigned";
    await pickup.save();

    // NOTIFY USER & COLLECTOR IN-APP + WHATSAPP + SMS
    createNotify(pickup.user, "User", "Collector Assigned", `Collector ${collectorUser.name} has been assigned to your pickup request.`, "success");
    createNotify(collectorId, "User", "New Task Assigned", `You have been assigned a new ${pickup.scrapType} pickup at ${pickup.address}`, "info");

    const customerUser = await User.findById(pickup.user);
    const shortId = pickup._id.toString().slice(-6);

    // Send Alert to Customer
    if (customerUser && customerUser.mobile) {
      await sendCollectorAssignedCustomerNotification({
        customerMobile: customerUser.mobile,
        customerName: customerUser.name,
        collectorName: collectorUser.name,
        collectorPhone: collectorUser.mobile,
        pickupId: shortId
      });
    }

    // Send Alert to Collector
    if (collectorUser && collectorUser.mobile) {
      await sendNewTaskCollectorNotification({
        collectorMobile: collectorUser.mobile,
        collectorName: collectorUser.name,
        customerName: pickup.name || customerUser?.name || "Customer",
        customerPhone: pickup.mobile || customerUser?.mobile,
        address: pickup.address,
        city: pickup.city,
        scrapType: pickup.scrapType,
        pickupId: shortId
      });
    }

    res.status(200).json({ success: true, message: "Collector assigned successfully", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   DELETE PICKUP
================================= */
const deletePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await Pickup.findById(id);
    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });
    await pickup.deleteOne();
    res.status(200).json({ success: true, message: "Pickup deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete pickup", error: error.message });
  }
};

/* ===============================
   RESET PASSWORD (ADMIN ONLY)
================================= */
const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = newPassword; 
    await user.save();

    res.status(200).json({ success: true, message: `Password reset successfully for ${user.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   MANAGE COLLECTORS
================================= */
const createCollector = async (req, res) => {
  try {
    let { name, mobile, email, password, area } = req.body;
    const exists = await User.findOne({ mobile });
    if (exists) return res.status(400).json({ success: false, message: "Mobile number already registered" });

    // Fix: Handle empty string email for sparse unique index
    if (!email || email.trim() === "") email = undefined;

    const assignedCity = req.user.role === "franchise" ? req.user.assignedCity : (req.body.assignedCity || area);

    const collector = await User.create({ 
      name, mobile, email, password, role: "collector", area, assignedCity 
    });

    // Send Credentials via WhatsApp & SMS
    await sendWelcomeCredentialsNotification({ name, mobile, role: "collector", password });

    res.status(201).json({ success: true, message: "Collector created", collector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCollectors = async (req, res) => {
  try {
    let query = { role: "collector" };
    if (req.user.role === "franchise") {
      query.assignedCity = { $regex: new RegExp(`^${req.user.assignedCity}$`, "i") };
    }
    const collectors = await User.find(query).sort({ createdAt: -1 }).lean();
    
    // Fetch average ratings for each collector
    const Review = require("../models/Review");
    const collectorsWithRatings = await Promise.all(collectors.map(async (c) => {
      const stats = await Review.aggregate([
        { $match: { collector: c._id } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
      ]);
      return {
        ...c,
        avgRating: stats.length > 0 ? stats[0].avgRating.toFixed(1) : "0.0",
        totalReviews: stats.length > 0 ? stats[0].totalReviews : 0
      };
    }));

    res.status(200).json({ success: true, collectors: collectorsWithRatings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCollector = async (req, res) => {
  try {
    const collectorId = req.params.id;
    console.log(`[DELETE] Collector ID: ${collectorId} by ${req.user.role} (${req.user.name})`);
    
    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== "collector") {
      return res.status(404).json({ success: false, message: "Collector not found" });
    }

    if (req.user.role === "franchise" && collector.assignedCity.toLowerCase() !== req.user.assignedCity.toLowerCase()) {
       return res.status(403).json({ success: false, message: "You can only manage collectors in your assigned city." });
    }

    // 1. Unassign all pickups from this collector
    await Pickup.updateMany(
      { collector: collectorId },
      { $unset: { collector: 1 }, status: "Pending" }
    );

    // 2. Delete the collector
    await User.findByIdAndDelete(collectorId);
    
    res.status(200).json({ success: true, message: "Collector deleted and pickups unassigned" });
  } catch (error) {
    console.error("Delete Collector Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   MANAGE USERS
================================= */
const createUser = async (req, res) => {
  try {
    let { name, mobile, email, password, address } = req.body;
    const exists = await User.findOne({ mobile });
    if (exists) return res.status(400).json({ success: false, message: "Mobile number already registered" });

    // Fix: Handle empty string email for sparse unique index
    if (!email || email.trim() === "") email = undefined;

    const user = await User.create({ 
      name, mobile, email, password, role: "user", address 
    });

    // Send Credentials via WhatsApp & SMS
    await sendWelcomeCredentialsNotification({ name, mobile, role: "user", password });

    res.status(201).json({ success: true, message: "User created", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`[DELETE] User ID: ${userId} by ${req.user.role} (${req.user.name})`);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Delete associated Pickups
    await Pickup.deleteMany({ user: userId });

    // 2. Delete associated Wallet Transactions
    await WalletTransaction.deleteMany({ user: userId });

    // 3. Delete the User record
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: "User and all associated data deleted" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   MANAGE FRANCHISES (ADMIN ONLY)
================================= */
const createFranchise = async (req, res) => {
  try {
    const { name, mobile, email, password, assignedCity } = req.body;
    if (!assignedCity) return res.status(400).json({ success: false, message: "Assigned City is required for a Franchise" });

    const exists = await User.findOne({ mobile });
    if (exists) return res.status(400).json({ success: false, message: "Mobile number already registered" });

    const franchise = await User.create({ name, mobile, email, password, role: "franchise", assignedCity });

    // Send Credentials via WhatsApp & SMS
    await sendWelcomeCredentialsNotification({ name, mobile, role: "franchise", password });

    res.status(201).json({ success: true, message: "Franchise created", franchise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllFranchises = async (req, res) => {
  try {
    const franchises = await User.find({ role: "franchise" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, franchises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFranchise = async (req, res) => {
  try {
    const franchiseId = req.params.id;
    console.log(`[DELETE] Franchise ID: ${franchiseId} by ${req.user.role} (${req.user.name})`);

    const franchise = await User.findById(franchiseId);
    if (!franchise || franchise.role !== "franchise") {
      return res.status(404).json({ success: false, message: "Franchise not found" });
    }

    // Optional: We might not want to delete ALL inventory/sales history for audit reasons,
    // but the user wants "database se bhi delete ho".
    // For now, let's just delete the franchise user.
    await User.findByIdAndDelete(franchiseId);

    res.status(200).json({ success: true, message: "Franchise deleted" });
  } catch (error) {
    console.error("Delete Franchise Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   MANAGE SCRAP ITEMS (RATES)
================================= */
const addScrapItem = async (req, res) => {
  try {
    const item = await ScrapItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateScrapItem = async (req, res) => {
  try {
    const item = await ScrapItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteScrapItem = async (req, res) => {
  try {
    await ScrapItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   CITY SPECIFIC RATES
================================= */
const updateCityRate = async (req, res) => {
  try {
    const { scrapItemId, price } = req.body;
    const city = req.body.city ? req.body.city.toLowerCase() : "";
    
    // Security check: Franchise can only update their own city
    if (req.user.role === "franchise" && city !== req.user.assignedCity.toLowerCase()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update rates for this city" });
    }

    const rate = await CityRate.findOneAndUpdate(
      { scrapItem: scrapItemId, city },
      { price },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Rate updated for " + city, rate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCityRates = async (req, res) => {
  try {
    const city = req.query.city ? req.query.city.toLowerCase() : "";
    if (!city) return res.status(400).json({ success: false, message: "City is required" });

    const cityRates = await CityRate.find({ city }).populate("scrapItem");
    res.status(200).json({ success: true, rates: cityRates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   WALLET MANAGEMENT (ADMIN)
================================= */

// Get global wallet stats (Liability)
const getWalletStats = async (req, res) => {
  try {
    if (req.user.role === "franchise") {
      // For Franchise: Show their own balance
      const recentTransactions = await WalletTransaction.find({ user: req.user._id })
        .populate("user", "name mobile")
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        stats: {
          totalAvailable: req.user.walletBalance,
          totalPending: req.user.pendingBalance,
          userCount: 1
        },
        recentTransactions
      });
    }

    // For Admin: Show global stats
    const stats = await User.aggregate([
      { $match: { role: { $ne: "admin" } } }, // Exclude Admin from liability
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: "$walletBalance" },
          totalPending: { $sum: "$pendingBalance" },
          userCount: { $sum: 1 }
        }
      }
    ]);

    const recentTransactions = await WalletTransaction.find()
      .populate("user", "name mobile")
      .sort({ createdAt: -1 })
      .limit(10);

    const customerStats = await User.aggregate([
      { $match: { role: "user" } },
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: "$walletBalance" }
        }
      }
    ]);

    const partnerStats = await User.aggregate([
      { $match: { role: { $in: ["franchise", "collector"] } } },
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: "$walletBalance" }
        }
      }
    ]);
    
    const finalStats = stats[0] || { totalAvailable: 0, totalPending: 0, userCount: 0 };
    finalStats.customerWalletBalance = customerStats[0]?.totalAvailable || 0;
    finalStats.partnerWalletBalance = partnerStats[0]?.totalAvailable || 0;

    res.status(200).json({
      success: true,
      stats: finalStats,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions for admin
const getAllTransactions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "franchise") {
      query.user = req.user._id;
    }

    const transactions = await WalletTransaction.find(query)
      .populate("user", "name mobile")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manual wallet update / Franchise Transfer
const updateUserWallet = async (req, res) => {
  try {
    const { userId, amount, type, description } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    // If a Franchise is doing this, it must be a credit to a collector in their city
    if (req.user.role === "franchise") {
      if (type !== "credit") return res.status(400).json({ success: false, message: "Franchises can only credit (transfer) funds to collectors." });
      
      if (targetUser.role !== "collector") {
        return res.status(403).json({ success: false, message: "Franchises can only transfer funds to collectors." });
      }

      const franchise = await User.findById(req.user._id);
      if (!targetUser.area || !franchise.assignedCity || targetUser.area.toLowerCase() !== franchise.assignedCity.toLowerCase()) {
        return res.status(403).json({ success: false, message: "You can only transfer funds to collectors in your assigned city." });
      }

      if (franchise.walletBalance < Number(amount)) {
        return res.status(400).json({ success: false, message: "Insufficient balance in Franchise wallet." });
      }

      // Deduct from Franchise
      franchise.walletBalance -= Number(amount);
      await franchise.save();

      // Log Franchise Debit
      await WalletTransaction.create({
        user: franchise._id,
        amount: Number(amount),
        type: "debit",
        status: "completed",
        description: `Transferred funds to collector ${targetUser.name}`,
        source: "transfer"
      });
    }

    // Add/Deduct from Target User
    if (type === "credit") {
      targetUser.walletBalance += Number(amount);
    } else {
      targetUser.walletBalance -= Number(amount);
    }
    await targetUser.save();

    // Log Target User Transaction
    await WalletTransaction.create({
      user: userId,
      amount: Number(amount),
      type,
      status: "completed",
      description: description || (req.user.role === "franchise" ? `Received funds from Franchise` : "Manual adjustment by Admin"),
      source: "transfer"
    });

    // Send WhatsApp Alert on Credit
    if (type === "credit" && targetUser.mobile) {
      try {
        await sendWalletCreditNotification({
          mobile: targetUser.mobile,
          name: targetUser.name,
          amount: Number(amount),
          pickupId: description || (req.user.role === "franchise" ? "Franchise Transfer" : "Admin Credit"),
          newBalance: targetUser.walletBalance
        });
      } catch (e) {
        console.error("WhatsApp wallet credit error:", e.message);
      }
    }

    res.status(200).json({ success: true, message: "Wallet updated successfully", balance: targetUser.walletBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Pending UPI Deposit
const approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await WalletTransaction.findById(id).populate("user");
    if (!transaction || transaction.source !== "deposit") {
      return res.status(404).json({ success: false, message: "Deposit request not found" });
    }
    if (transaction.status !== "pending") {
      return res.status(400).json({ success: false, message: `Deposit request is already ${transaction.status}` });
    }

    // Add balance to user
    const targetUser = await User.findById(transaction.user._id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Associated user not found" });
    }

    targetUser.walletBalance += transaction.amount;
    await targetUser.save();

    // Mark transaction completed
    transaction.status = "completed";
    transaction.description = `Wallet Deposit (UPI Approved: ${transaction.depositDetails?.upiRefNo})`;
    await transaction.save();

    // Notify user in-app + WhatsApp + SMS
    createNotify(targetUser._id, "User", "Deposit Approved! 🏦", `Your wallet deposit of ₹${transaction.amount} has been verified and approved.`, "success");

    if (targetUser.mobile) {
      const { sendWalletCreditNotification } = require("../utils/notifier");
      await sendWalletCreditNotification({
        mobile: targetUser.mobile,
        name: targetUser.name,
        amount: transaction.amount,
        pickupId: "Deposit",
        newBalance: targetUser.walletBalance
      });
    }

    res.status(200).json({
      success: true,
      message: "Deposit request approved and wallet credited successfully!",
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject Pending UPI Deposit
const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const transaction = await WalletTransaction.findById(id);
    if (!transaction || transaction.source !== "deposit") {
      return res.status(404).json({ success: false, message: "Deposit request not found" });
    }
    if (transaction.status !== "pending") {
      return res.status(400).json({ success: false, message: `Deposit request is already ${transaction.status}` });
    }

    // Mark transaction failed
    transaction.status = "failed";
    transaction.description = `Deposit Rejected: ${adminNote || "Invalid UTR / Payment not received"}`;
    await transaction.save();

    // Notify user
    createNotify(transaction.user, "User", "Deposit Rejected ❌", `Your deposit request of ₹${transaction.amount} was rejected. Note: ${adminNote || "Payment not received"}`, "error");

    res.status(200).json({
      success: true,
      message: "Deposit request rejected successfully.",
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   CLEAN DUMMY TEST DATA (PRESERVE FRANCHISE & ADMIN)
================================= */
const cleanTestData = async (req, res) => {
  try {
    const Contact = require("../models/Contact");
    const Review = require("../models/Review");
    const Notification = require("../models/Notification");
    const Withdrawal = require("../models/Withdrawal");

    // 1. Delete all test pickups
    await Pickup.deleteMany({});

    // 2. Delete all test transactions & withdrawals
    await WalletTransaction.deleteMany({});
    await Withdrawal.deleteMany({});

    // 3. Delete all test contacts, reviews & notifications
    await Contact.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    // 4. Delete all customer test users (role: "user"), preserve "admin" and "franchise"
    await User.deleteMany({ role: "user" });

    // 5. Reset wallet balances & pending balances for preserved Franchises & Admins
    await User.updateMany({ role: { $in: ["admin", "franchise"] } }, { $set: { walletBalance: 0, pendingBalance: 0 } });

    res.status(200).json({
      success: true,
      message: "Test data cleaned successfully! Franchise and Admin accounts preserved."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllPickups,
  updatePickupStatus,
  assignPickup,
  deletePickup,
  resetPassword,
  createCollector,
  getAllCollectors,
  deleteCollector,
  createUser,
  getAllUsers,
  deleteUser,
  addScrapItem,
  updateScrapItem,
  deleteScrapItem,
  getWalletStats,
  getAllTransactions,
  updateUserWallet,
  createFranchise,
  getAllFranchises,
  deleteFranchise,
  updateCityRate,
  getCityRates,
  approveDeposit,
  rejectDeposit,
  cleanTestData
};