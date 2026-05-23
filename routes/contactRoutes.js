const express = require("express");
const router = express.Router();
const {
  submitContactMessage,
  getContactMessages,
  updateContactStatus
} = require("../controllers/contactController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public route to submit messages
router.post("/", submitContactMessage);

// Admin-only routes to manage messages
router.get("/", protect, authorize("admin", "franchise"), getContactMessages);
router.put("/:id", protect, authorize("admin", "franchise"), updateContactStatus);

module.exports = router;
