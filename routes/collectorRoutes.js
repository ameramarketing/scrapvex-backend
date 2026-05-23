// routes/collectorRoutes.js

const express = require("express");

const router =
  express.Router();

const {
  getCollectorStats,
  getAssignedPickups,
  markCompleted,
  updatePickupStatus
} = require(
  "../controllers/collectorController"
);

const {
  protect
} = require(
  "../middleware/authMiddleware"
);

const {
  authorize
} = require(
  "../middleware/roleMiddleware"
);

/* ==================================
   COLLECTOR ONLY ROUTES
================================== */

/* Dashboard Stats */
router.get(
  "/dashboard",
  protect,
  authorize("collector"),
  getCollectorStats
);

/* Get Assigned Pickups */
router.get(
  "/pickups",
  protect,
  authorize("collector"),
  getAssignedPickups
);

/* Mark Pickup Completed */
router.put(
  "/pickup/:id/complete",
  protect,
  authorize("collector"),
  markCompleted
);

/* Custom Status Update */
router.put(
  "/pickup/:id/status",
  protect,
  authorize("collector"),
  updatePickupStatus
);

module.exports =
  router;