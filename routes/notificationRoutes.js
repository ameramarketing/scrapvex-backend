const express = require("express");
const router = express.Router();
const { getMyNotifications, markAsRead, markAllRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.put("/mark-all-read", protect, markAllRead);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
