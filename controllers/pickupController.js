const Pickup = require("../models/Pickup");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Inventory = require("../models/Inventory");
const Settings = require("../models/Settings");
const { createNotify } = require("./notificationController");

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
      latitude: latitude || 0, longitude: longitude || 0,
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

    // 5. NOTIFICATIONS
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

    const userId = pickup.user.toString();
    const user = await User.findById(userId);
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

    res.status(200).json({ success: true, message: "OTP sent to customer dashboard" }); 
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

    if (status === "Completed") {
      const finalAmount = Number(amount || pickup.amount || 0);
      const user = await User.findById(pickup.user);
      
      if (user) {
        const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending", user: user._id });

        if (transaction) {
          user.pendingBalance = Math.max(0, user.pendingBalance - transaction.amount);
        }

        if (paymentMode === "cash") {
          if (transaction) {
            transaction.status = "paid_in_cash";
            transaction.description = `Paid in Cash for pickup #${pickup._id.toString().slice(-6)}`;
            await transaction.save();
          }
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

        const collectorUser = await User.findById(req.user._id);
        if (collectorUser) {
          let commissionRate = 0.05; // fallback 5%
          const settings = await Settings.findOne();
          if (settings && settings.pickupCommissionPercentage !== undefined) {
             commissionRate = settings.pickupCommissionPercentage / 100;
          }
          const displayPercent = (commissionRate * 100).toFixed(1);
          const commissionAmount = finalAmount * commissionRate;
          const totalCollectorDue = finalAmount + commissionAmount;

          if (paymentMode === "cash") {
            // For cash payments: do not deduct from anyone — credit collector with full amount.
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
            // commissionTakenFromCollector remains false for cash mode
          } else {
            const franchise = await User.findOne({ 
              role: "franchise", 
              assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
            });

            const collectorCover = Math.min(collectorUser.walletBalance, finalAmount);
            const remainingAmount = finalAmount - collectorCover;

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

            if (remainingAmount > 0) {
              if (!franchise) {
                return res.status(400).json({ success: false, message: "No franchise is available to fund this pickup." });
              }
              if (franchise.walletBalance < remainingAmount) {
                return res.status(400).json({ 
                  success: false, 
                  message: `Franchise (${franchise.name}) has insufficient balance (Available: ₹${franchise.walletBalance}). Please use Cash mode or ask collector to add funds.` 
                });
              }

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

              // Charge the collector for the remaining amount (collector owes this; wallet may go negative)
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

            // commission will be applied after handling payment sources
          }
          // Apply admin commission: always debit collector (wallet may go negative) and credit admin
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
              console.log(`[ADMIN COMMISSION] ₹${commissionAmount} credited to ${admin.name}`);
            }
          }
        }

        // 1. Notify User (Wallet Details)
        createNotify(user._id, "User", "Pickup Completed", paymentMode === "cash" ? `Your pickup is complete. (Paid in Cash)` : `₹${finalAmount} added to your wallet for pickup.`, "success");
        
        // 2. Notify Collector (Simple Confirmation & Wallet Update)
        if (paymentMode === "cash") {
          createNotify(req.user._id, "User", "Wallet Credited", `₹${finalAmount} added to your wallet (Cash Reimbursement).`, "success");
        } else {
          createNotify(req.user._id, "User", "Wallet Updated", `₹${finalAmount} debited from your wallet for pickup #${pickup._id.toString().slice(-6)}.`, "info");
          if (collectorUser.walletBalance < 0) {
            createNotify(req.user._id, "User", "Negative Balance", `Your wallet balance is ₹${collectorUser.walletBalance.toFixed(2)}. Please settle with your franchise.`, "warning");
          }
        }
        createNotify(req.user._id, "Collector", "Task Completed", `Pickup #${pickup._id.toString().slice(-6)} finalized successfully.`, "info");

        // 3. Notify Regional Franchise
        const regionalFranchises = await User.find({ 
          role: "franchise", 
          assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
        });
        regionalFranchises.forEach(franchise => {
          createNotify(franchise._id, "User", "Pickup Completed", `Collector ${req.user.name} completed pickup #${pickup._id.toString().slice(-6)} for ₹${finalAmount}`, "success");
        });
      }
      pickup.status = "Completed";

      // Inventory update removed from here. 
      // Material enters inventory only when Franchise records a "Purchase" from the collector.
    } 
    else if (status === "Rejected") {
      // If collector rejects, mark as Rejected but keep collector ID for their history
      pickup.status = "Rejected";
      pickup.collector = req.user._id;
    } 
    else if (status === "Cancelled") {
      // Only if the pickup is actually CANCELLED (by user or admin), we remove pending balance
      const transaction = await WalletTransaction.findOne({ pickupId: pickup._id, status: "pending" });
      if (transaction) {
        const user = await User.findById(pickup.user);
        if (user) {
          user.pendingBalance -= transaction.amount;
          await user.save();
        }
        transaction.status = "cancelled";
        await transaction.save();
      }
      pickup.status = "Cancelled";
    } else if (status === "Accepted") {
      pickup.status = "Accepted";
      pickup.collector = req.user._id;
      
      // Notify User
      createNotify(pickup.user, "User", "Pickup Accepted", `Collector ${req.user.name} has accepted your pickup request and is on the way!`, "success");

      // NEW: Notify Franchises
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

    // Notify Franchises on Completion
    if (status === "Completed") {
       const regionalFranchises = await User.find({ 
         role: "franchise", 
         assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } 
       });
       regionalFranchises.forEach(franchise => {
         createNotify(franchise._id, "User", "Pickup Completed", `Collector ${req.user.name} completed pickup for ${pickup.name}. Amount: ₹${pickup.amount}`, "pickup_completed");
       });
    }
    res.status(200).json({ success: true, pickup });
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

module.exports = {
  createPickup,
  getMyPickups,
  getPickupById,
  cancelPickup,
  updatePickup,
  getAvailablePickups,
  updatePickupStatusCollector,
  generateOTP,
  getActiveCities
};