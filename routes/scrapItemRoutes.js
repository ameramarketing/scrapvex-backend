const express = require("express");
const router = express.Router();
const {
  getScrapItems,
  getActiveCities,
  createScrapItem,
  updateScrapItem,
  deleteScrapItem
} = require("../controllers/scrapItemController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Public routes
router.get("/", getScrapItems);
router.get("/cities", getActiveCities);

// Admin only routes for management
router.post("/", protect, authorize("admin"), createScrapItem);
router.put("/:id", protect, authorize("admin"), updateScrapItem);
router.delete("/:id", protect, authorize("admin"), deleteScrapItem);

module.exports = router;
