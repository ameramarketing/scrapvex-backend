// routes/pickupRoutes.js

const express = require("express");
const router = express.Router();
const {
  createPickup,
  getMyPickups,
  getPickupById,
  cancelPickup,
  updatePickup,
  getAvailablePickups,
  updatePickupStatusCollector,
  generateOTP,
  getActiveCities
} = require("../controllers/pickupController");

const { protect } = require("../middleware/authMiddleware");

/* ==================================
   COLLECTOR ROUTES (Must be above /:id)
   ================================== */
router.get("/available", protect, getAvailablePickups);
router.post("/collector/generate-otp/:id", protect, generateOTP);
router.put("/collector/status/:id", protect, updatePickupStatusCollector);

/* ==================================
   USER PICKUP ROUTES
   ================================== */

/* Get Active Cities (Cities with franchises) */
router.get("/active-cities", getActiveCities);

/* Create New Pickup (Public/Guest allowed) */
router.post("/create", createPickup);

/* Get Logged User Pickups */
router.get("/my", protect, getMyPickups);

/* Get Single Pickup (Place this AFTER specific routes like /available) */
router.get("/:id", protect, getPickupById);

/* Update Pickup */
router.put("/:id", protect, updatePickup);

/* Cancel Pickup */
router.put("/:id/cancel", protect, cancelPickup);

module.exports = router;