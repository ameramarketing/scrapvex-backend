const Pickup = require("../models/Pickup");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Inventory = require("../models/Inventory");
const Settings = require("../models/Settings");
const AreaVote = require("../models/AreaVote");
const { createNotify } = require("./notificationController");
const { sendWhatsAppOTP } = require("../utils/whatsapp");
const { sendCollectorOnTheWayNotification, sendPickupCompletedReceiptNotification } = require("../utils/notifier");

/* ==================================
   CREATE NEW PICKUP BOOKING
================================== */
const createPickup = async (req, res) => {
  try {
    // ... existing token logic ...
    let userId = null;
    let tokenRole = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        tokenRole = decoded.role;
      } catch (err) {
        console.error("Token verification failed for booking:", err.message);
      }
    }

    // Only users (role: "user") or guests (no token) can book pickups
    if (tokenRole && tokenRole !== "user") {
      return res.status(403).json({ 
        success: false, 
        message: "Only customers can book pickups. Please login with a user account." 
      });
    }

      const {
        name,
        mobile,
        address,
        city,
        pincode,
        scrapType,
        weight,
        items,
        pickupDate,
        pickupTime,
        latitude,
        longitude,
        notes
      } = req.body;

      if (!name || !mobile || !address || !city || !pincode || !scrapType) {
        return res.status(400).json({ success: false, message: "Please fill all required fields" });
      }

      // 1. CHECK IF CITY HAS FRANCHISE
      const regionalFranchises = await User.find({
        role: "franchise",
        assignedCity: { $regex: new RegExp(`^${city}$`, "i") }
      });

      if (regionalFranchises.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Sorry, our service is not yet available in ${city}. We are expanding soon!` 
        });
      }

    // 2. CREATE OR FIND USER
    let user = await User.findOne({ mobile });
    
    if (!user) {
      user = await User.create({ 
        name: name || "Guest User", mobile, password: mobile, role: "user"
      });
    }

    // 3. CREATE PICKUP
    const pickup = await Pickup.create({
      user: user._id, name, mobile, address, city, pincode: pincode || 0,
      scrapType, weight: weight || 0, items: items || [],
      pickupDate: pickupDate || new Date(), pickupTime: pickupTime || "",
      latitude: latitude || req.body.lat || 0, longitude: longitude || req.body.lng || 0,
      lat: req.body.lat || latitude || null, lng: req.body.lng || longitude || null,
      notes: notes || "", status: "Pending", amount: req.body.amount || 0
    });

    // 4. LOCK PENDING BALANCE (show user estimated amount is locked)
    const estimatedAmount = req.body.amount || 0;
    if (estimatedAmount > 0) {
      try {
        await WalletTransaction.create({
          user: user._id,
          amount: estimatedAmount,
          type: "credit",
          status: "pending",
          description: `Estimated credit for pickup #${pickup._id.toString().slice(-6)} (${scrapType})`,
          source: "pickup",
          pickupId: pickup._id
        });
        user.pendingBalance = (user.pendingBalance || 0) + estimatedAmount;
        await user.save();
        console.log(`[PENDING LOCK] ₹${estimatedAmount} locked for ${user.name}`);
      } catch (walletErr) {
        console.error("Pending Balance Error:", walletErr.message);
      }
    }

    // 5. NOTIFICATIONS & WHATSAPP + SMS DISPATCH
    const admins = await User.find({ role: "admin" });
    const onlineCollectors = await User.find({ 
      role: "collector", isOnline: true, assignedCity: { $regex: new RegExp(`^${city}$`, "i") }
    });

    admins.forEach(admin => {
      createNotify(admin._id, "User", "New Pickup Request", `New ${scrapType} pickup request by ${name}`, "pickup_request");
    });

    onlineCollectors.forEach(collector => {
      createNotify(collector._id, "User", "New Available Pickup", `A new ${scrapType} pickup is available in ${city}`, "info");
    });

    regionalFranchises.forEach(franchise => {
      createNotify(franchise._id, "User", "New City Pickup", `Customer ${name} booked a ${scrapType} pickup in ${city}`, "pickup_request");
    });

    // Send Instant WhatsApp & SMS Booking Alert
    try {
      const { sendPickupBookingNotification } = require("../utils/notifier");
      await sendPickupBookingNotification({
        mobile: mobile,
        name: name,
        pickupId: pickup._id.toString().slice(-6),
        date: pickupDate,
        timeSlot: pickupTime,
        scrapType: scrapType,
        estimatedAmount: estimatedAmount
      });
    } catch (waErr) {
      console.log("Booking notification dispatch note:", waErr.message);
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      success: true,
      message: "Pickup booked successfully",
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile, role: "user" },
      pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create pickup", error: error.message });
  }
};

/* ==================================
   GET LOGGED IN USER PICKUPS
================================== */
const getMyPickups = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = { user: userId };
    if (userRole === "collector") {
      query = { collector: userId };
    }

    const pickups = await Pickup.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pickups
    });
  } catch (error) {
    console.error("getMyPickups Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your bookings",
      error: error.message
    });
  }
};

/* ==================================
   GET SINGLE PICKUP
================================== */
const getPickupById =
  async (req, res) => {
    try {
      const pickup =
        await Pickup.findById(
          req.params.id
        );

      if (!pickup) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Pickup not found"
          });
      }

      res.status(200).json({
        success: true,
        pickup
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch pickup",
        error:
          error.message
      });
    }
  };

/* ==================================
   CANCEL PICKUP
================================== */
const cancelPickup =
  async (req, res) => {
    try {
      const pickup =
        await Pickup.findById(
          req.params.id
        );

      if (!pickup) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Pickup not found"
          });
      }

      if (pickup.status === "Completed") {
        return res.status(400).json({ success: false, message: "Completed pickup cannot be cancelled" });
      }

      // WALLET LOGIC: Revert pending balance if exists
      try {
        const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending" });
        if (transaction) {
          const user = await User.findById(pickup.user);
          if (user) {
            user.pendingBalance = Math.max(0, (user.pendingBalance || 0) - (transaction.amount || 0));
            await user.save();
          }
          transaction.status = "cancelled";
          await transaction.save();
        }
      } catch (walletErr) {
        console.error("Wallet Reversal Error:", walletErr.message);
      }

      pickup.status = "Cancelled";
      await pickup.save();
      
      try {
        if (pickup.user) {
          createNotify(pickup.user, "User", "Pickup Cancelled", `Your pickup request #${pickup._id.toString().slice(-6)} has been cancelled.`, "info");
        }
      } catch (notifyErr) {
        console.error("Notification Error:", notifyErr.message);
      }

      
      res.status(200).json({
        success: true,
        message: "Pickup cancelled successfully",
        pickup
      });
    } catch (error) {
      console.error("Cancel Pickup Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel pickup (Simple)",
        error: error.message
      });
    }
  };



/* ==================================
   UPDATE PICKUP DETAILS
================================== */
const updatePickup =
  async (req, res) => {
    try {
      const pickup =
        await Pickup.findById(
          req.params.id
        );

      if (!pickup) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Pickup not found"
          });
      }

      pickup.address =
        req.body.address ||
        pickup.address;

      pickup.scrapType =
        req.body.scrapType ||
        pickup.scrapType;

      pickup.weight =
        req.body.weight ||
        pickup.weight;

      pickup.date =
        req.body.date ||
        pickup.date;

      const updated =
        await pickup.save();

      res.status(200).json({
        success: true,
        message:
          "Pickup updated successfully",
        pickup:
          updated
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to update pickup",
        error:
          error.message
      });
    }
  };


const getAvailablePickups = async (req, res) => {
  try {
    const collector = await User.findById(req.user._id);
    const statusQuery = { status: { $in: ["Pending", "Assigned", "Accepted", "Completed", "Rejected"] } };
    const orConditions = [{ collector: collector._id }];

    if (collector && collector.area) {
      orConditions.push({ city: { $regex: new RegExp(`^${collector.area}$`, "i") } });
    }

    const pickups = await Pickup.find({
      ...statusQuery,
      $or: orConditions
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, pickups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateOTP = async (req, res) => {
  try {
    const { amount, items } = req.body;
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    pickup.verificationCode = otp;
    
    // Save temporary billing info to pickup
    if (amount) pickup.amount = amount;
    if (items) pickup.items = items;
    
    await pickup.save();

    const userId = pickup.user ? pickup.user.toString() : null;
    const user = userId ? await User.findById(userId) : null;
    if (user) {
      const summary = (items || []).map(i => `${i.name} (${i.quantity}${i.unit})`).join(", ");
      await createNotify(
        user._id, 
        "User", 
        "Security OTP", 
        `Your OTP for ${summary} (Total ₹${amount}) is ${otp}. Verify weight before sharing.`, 
        "info"
      );
    }

    // Send Bill breakdown + OTP via WhatsApp
    const targetMobile = (user && user.mobile) || pickup.mobile;
    const targetName = (user && user.name) || pickup.name;
    if (targetMobile) {
      const itemsSummary = (items || []).map(i => `• ${i.name}: ${i.quantity} ${i.unit} @ ₹${i.price} = ₹${i.subtotal}`).join('\n');
      const waMsg = `🟢 *ScrapVex Bill & Verification OTP*\n\nDear *${targetName}*,\nHere is the bill for your Pickup (#${pickup._id.toString().slice(-6)}):\n\n${itemsSummary}\n\n💰 *Total Amount*: ₹${amount}\n\n🔑 *Completion OTP*: *${otp}*\n\nPlease share this OTP with the collector ONLY after verifying items & total amount.`;
      try { await sendWhatsAppOTP(targetMobile, waMsg); } catch (e) { console.error("WhatsApp OTP send error:", e.message); }
    }

    res.status(200).json({ success: true, message: "OTP & Bill sent to WhatsApp & Customer Dashboard" }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePickupStatusCollector = async (req, res) => {
  try {
    const { status, weight, scrapType, amount, items, paymentMode, otp } = req.body; 
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ success: false, message: "Not found" });

    // Verify OTP for completion
    if (status === "Completed") {
      if (!otp || otp !== pickup.verificationCode) {
        return res.status(400).json({ success: false, message: "Invalid OTP. Please check with customer." });
      }
    }

    // Update basic fields
    if (weight) pickup.weight = weight;
    if (scrapType) pickup.scrapType = scrapType;
    if (amount) pickup.amount = amount;
    if (items) pickup.items = items;
    pickup.collector = req.user._id;

    const isCashMode = paymentMode && paymentMode.toString().toLowerCase() === "cash";

    if (status === "Completed") {
      const finalAmount = Number(amount || pickup.amount || 0);
      const user = pickup.user ? await User.findById(pickup.user) : null;
      const collectorUser = await User.findById(req.user._id);

      // PRE-CHECK WALLET MODE FUNDS BEFORE MUTATING DB OR CREATING TRANSACTIONS
      let franchise = null;
      let collectorCover = 0;
      let remainingAmount = 0;

      if (!isCashMode) {
        if (!collectorUser) {
          return res.status(400).json({ success: false, message: "Collector user profile not found." });
        }
        collectorCover = Math.min(collectorUser.walletBalance, finalAmount);
        remainingAmount = finalAmount - collectorCover;

        if (remainingAmount > 0) {
          franchise = await User.findOne({ 
            role: "franchise", 
            assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
          });
          if (!franchise) {
            return res.status(400).json({ success: false, message: "No franchise is available to fund this pickup." });
          }
          if (franchise.walletBalance < remainingAmount) {
            return res.status(400).json({ 
              success: false, 
              message: `Franchise (${franchise.name}) has insufficient balance (Available: ₹${franchise.walletBalance}). Please use Cash mode or ask collector to add funds.` 
            });
          }
        }
      }

      // NOW THAT ALL PRE-CHECKS PASSED, MUTATE BALANCES AND CREATE TRANSACTIONS SAFELY!
      if (user) {
        const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending", user: user._id });

        if (transaction) {
          user.pendingBalance = Math.max(0, user.pendingBalance - transaction.amount);
        }

        if (isCashMode) {
          if (transaction) {
            transaction.status = "paid_in_cash";
            transaction.description = `Paid in Cash for pickup #${pickup._id.toString().slice(-6)}`;
            await transaction.save();
          }
          // Cash mode: Paid directly in cash to user, user.walletBalance IS NOT MODIFIED!
        } else {
          if (transaction) {
            transaction.amount = finalAmount;
            transaction.status = "completed";
            transaction.description = `Credit for completed pickup #${pickup._id.toString().slice(-6)}`;
            await transaction.save();
          } else {
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
          user.walletBalance += finalAmount;
        }

        user.pendingBalance = Math.max(0, user.pendingBalance || 0);
        await user.save();
      }

      if (collectorUser) {
        let commissionRate = 0.05; // fallback 5%
        const settings = await Settings.findOne();
        if (settings && settings.pickupCommissionPercentage !== undefined) {
           commissionRate = settings.pickupCommissionPercentage / 100;
        }
        const displayPercent = (commissionRate * 100).toFixed(1);
        const commissionAmount = finalAmount * commissionRate;

        if (isCashMode) {
          // Cash mode: Collector paid customer in cash directly out of pocket.
          // Credit collector's wallet with Cash Reimbursement.
          collectorUser.walletBalance += finalAmount;
          await collectorUser.save();

          await WalletTransaction.create({
            user: collectorUser._id,
            amount: finalAmount,
            type: "credit",
            status: "completed",
            description: `Reimbursement for Cash paid for pickup #${pickup._id.toString().slice(-6)}`,
            source: "pickup",
            pickupId: pickup._id
          });
        } else {
          if (collectorCover > 0) {
            collectorUser.walletBalance -= collectorCover;
            await WalletTransaction.create({
              user: collectorUser._id,
              amount: collectorCover,
              type: "debit",
              status: "completed",
              description: `Collector contribution for pickup #${pickup._id.toString().slice(-6)}`,
              source: "pickup",
              pickupId: pickup._id
            });
          }

          if (remainingAmount > 0 && franchise) {
            franchise.walletBalance -= remainingAmount;
            await franchise.save();

            await WalletTransaction.create({
              user: franchise._id,
              amount: remainingAmount,
              type: "debit",
              status: "completed",
              description: `Funded remaining amount for pickup #${pickup._id.toString().slice(-6)} in ${pickup.city}`,
              source: "pickup",
              pickupId: pickup._id
            });

            // Charge the collector for the remaining amount
            collectorUser.walletBalance -= remainingAmount;
            await collectorUser.save();

            await WalletTransaction.create({
              user: collectorUser._id,
              amount: remainingAmount,
              type: "debit",
              status: "completed",
              description: `Collector liability for franchise-funded portion for pickup #${pickup._id.toString().slice(-6)}`,
              source: "pickup",
              pickupId: pickup._id
            });
          }
        }

        // Apply admin commission to collector
        if (commissionAmount > 0) {
          collectorUser.walletBalance -= commissionAmount;
          await collectorUser.save();

          await WalletTransaction.create({
            user: collectorUser._id,
            amount: commissionAmount,
            type: "debit",
            status: "completed",
            description: `Admin Commission (${displayPercent}%) for pickup #${pickup._id.toString().slice(-6)}`,
            source: "commission",
            pickupId: pickup._id
          });

          const admin = await User.findOne({ role: "admin" });
          if (admin) {
            admin.walletBalance += commissionAmount;
            await admin.save();

            await WalletTransaction.create({
              user: admin._id,
              amount: commissionAmount,
              type: "credit",
              status: "completed",
              description: `Commission (${displayPercent}%) from collector ${collectorUser.name} for pickup #${pickup._id.toString().slice(-6)}`,
              source: "commission",
              pickupId: pickup._id
            });
          }
        }
      }

      // In-app Notifications
      if (user) {
        createNotify(user._id, "User", "Pickup Completed", isCashMode ? `Your pickup is complete. (Paid in Cash ₹${finalAmount})` : `₹${finalAmount} added to your wallet for pickup.`, "success");
      }
      createNotify(req.user._id, "Collector", "Task Completed", `Pickup #${pickup._id.toString().slice(-6)} finalized successfully.`, "info");

      // WHATSAPP COMPLETED RECEIPT NOTIFICATION TO CUSTOMER!
      const targetMobile = (user && user.mobile) || pickup.mobile;
      const targetName = (user && user.name) || pickup.name;
      if (targetMobile) {
        const calcWeight = items && items.length > 0 ? items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) : pickup.weight;
        try {
          await sendPickupCompletedReceiptNotification({
            customerMobile: targetMobile,
            customerName: targetName,
            pickupId: pickup._id.toString().slice(-6),
            totalWeight: calcWeight,
            totalAmount: finalAmount,
            paymentMode: isCashMode ? "Cash" : "ScrapVex Wallet"
          });
        } catch (e) {
          console.error("WhatsApp completed notification error:", e.message);
        }
      }

      // Notify Regional Franchise
      const regionalFranchises = await User.find({ 
        role: "franchise", 
        assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
      });
      regionalFranchises.forEach(franchise => {
        createNotify(franchise._id, "User", "Pickup Completed", `Collector ${req.user.name} completed pickup #${pickup._id.toString().slice(-6)} for ₹${finalAmount}`, "success");
      });

      pickup.status = "Completed";
    } 
    else if (status === "Rejected") {
      pickup.status = "Rejected";
      pickup.collector = req.user._id;
    } 
    else if (status === "Cancelled") {
      const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending" });
      if (transaction) {
        const user = pickup.user ? await User.findById(pickup.user) : null;
        if (user) {
          user.pendingBalance = Math.max(0, user.pendingBalance - transaction.amount);
          await user.save();
        }
        transaction.status = "cancelled";
        await transaction.save();
      }
      pickup.status = "Cancelled";
    } else if (status === "Accepted") {
      pickup.status = "Accepted";
      pickup.collector = req.user._id;
      
      const user = pickup.user ? await User.findById(pickup.user) : null;
      if (user) {
        createNotify(user._id, "User", "Pickup Accepted", `Collector ${req.user.name} has accepted your pickup request and is on the way!`, "success");
      }

      // WHATSAPP ACCEPTED NOTIFICATION TO CUSTOMER!
      const targetMobile = (user && user.mobile) || pickup.mobile;
      const targetName = (user && user.name) || pickup.name;
      if (targetMobile) {
        try {
          await sendCollectorOnTheWayNotification({
            customerMobile: targetMobile,
            customerName: targetName,
            collectorName: req.user.name,
            pickupId: pickup._id.toString().slice(-6)
          });
        } catch (e) {
          console.error("WhatsApp accept notification error:", e.message);
        }
      }

      const regionalFranchises = await User.find({ 
        role: "franchise", 
        assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
      });
      regionalFranchises.forEach(franchise => {
        createNotify(franchise._id, "User", "Pickup Accepted", `Collector ${req.user.name} accepted pickup for ${pickup.name} in ${pickup.city}`, "pickup_accepted");
      });
    } else {
      pickup.status = status;
    }

    await pickup.save();

    res.status(200).json({ success: true, message: "Status updated successfully", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActiveCities = async (req, res) => {
  try {
    const franchises = await User.find({ role: "franchise" }).select("assignedCity");
    const cities = [...new Set(
      franchises
        .map(f => f.assignedCity)
        .filter(city => city && city.trim().length > 0)
        .map(city => city.trim())
    )].sort();
    res.status(200).json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const voteArea = async (req, res) => {
  try {
    const { area, mobile } = req.body;
    if (!area) return res.status(400).json({ success: false, message: "Area name is required" });

    await AreaVote.create({ area, userMobile: mobile || "", ip: req.ip || "" });
    const votesCount = await AreaVote.countDocuments({ area: { $regex: new RegExp(`^${area}$`, "i") } });

    res.status(200).json({
      success: true,
      message: `Vote recorded for ${area}! We are planning service expansion.`,
      votesCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPickup,
  getMyPickups,
  getPickupById,
  cancelPickup,
  updatePickup,
  getAvailablePickups,
  updatePickupStatusCollector,
  generateOTP,
  getActiveCities,
  voteArea
};