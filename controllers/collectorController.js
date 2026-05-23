// controllers/collectorController.js

const Pickup = require("../models/Pickup");

/* ==================================
   GET COLLECTOR DASHBOARD STATS
================================== */
const getCollectorStats = async (req, res) => {
  try {
    const collectorId = req.user._id;
    const pending = await Pickup.countDocuments({ status: "Pending" });
    const assigned = await Pickup.countDocuments({ collector: collectorId, status: "Assigned" });
    const completed = await Pickup.countDocuments({ collector: collectorId, status: "Completed" });
    
    const completedJobs = await Pickup.find({ collector: collectorId, status: "Completed" });
    const earnings = completedJobs.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: { pending, assigned, completed, earnings }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Stats Load Error", error: error.message });
  }
};

/* ==================================
   GET ALL AVAILABLE & ASSIGNED
================================== */
const getAssignedPickups = async (req, res) => {
  try {
    const collectorId = req.user._id;
    // Show all Pending (open) + those assigned to this collector
    const pickups = await Pickup.find({
      $or: [
        { status: "Pending" },
        { collector: collectorId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, pickups });
  } catch (error) {
    console.error("Fetch Pickups Error:", error);
    res.status(500).json({ success: false, message: "Collector DB Fetch Error", error: error.message });
  }
};

/* ==================================
   MARK PICKUP COMPLETED
================================== */
const markCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await Pickup.findById(id);

    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });

    pickup.status = "Completed";
    await pickup.save();

    res.status(200).json({ success: true, message: "Pickup marked completed", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update pickup", error: error.message });
  }
};

const { createNotify } = require("./notificationController");
const User = require("../models/User");

/* ==================================
   UPDATE PICKUP STATUS CUSTOM
================================== */
const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pickup = await Pickup.findById(id);

    if (!pickup) return res.status(404).json({ success: false, message: "Pickup not found" });

    const oldStatus = pickup.status;
    pickup.status = status;
    
    if (status === "Accepted") {
      pickup.collector = req.user._id;
    } else if (status === "Rejected") {
      pickup.status = "Pending";
      pickup.collector = null;
    }

    await pickup.save();

    // NOTIFICATIONS
    try {
      if (status === "Accepted") {
        // Notify Customer
        if (pickup.user) {
          createNotify(pickup.user, "User", "Pickup Accepted", `Collector ${req.user.name} has accepted your pickup request.`, "success");
        }
        // Notify Franchise
        const franchise = await User.findOne({ role: "franchise", assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } });
        if (franchise) {
          createNotify(franchise._id, "User", "Pickup Accepted", `Collector ${req.user.name} accepted pickup #${pickup._id.toString().slice(-6)} in ${pickup.city}`, "info");
        }
      } else if (status === "Completed") {
        // Notify Franchise
        const franchise = await User.findOne({ role: "franchise", assignedCity: { $regex: new RegExp(`^${pickup.city}$`, "i") } });
        if (franchise) {
          createNotify(franchise._id, "User", "Pickup Completed", `Collector ${req.user.name} completed pickup #${pickup._id.toString().slice(-6)}`, "success");
        }
      }
    } catch (err) {
      console.error("Notification Error:", err.message);
    }

    res.status(200).json({ success: true, message: "Status updated successfully", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
  }
};

module.exports = {
  getCollectorStats,
  getAssignedPickups,
  markCompleted,
  updatePickupStatus
};