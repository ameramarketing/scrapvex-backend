const express = require("express");
const router = express.Router();
const { getBroadcasts, createBroadcast, deleteBroadcast } = require("../controllers/broadcastController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin"), getBroadcasts);
router.post("/", protect, authorize("admin"), createBroadcast);
router.delete("/:id", protect, authorize("admin"), deleteBroadcast);

module.exports = router;
