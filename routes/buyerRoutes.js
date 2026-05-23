const express = require("express");
const router = express.Router();
const { getBuyers, createBuyer, updateBuyer, deleteBuyer } = require("../controllers/buyerController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "franchise"), getBuyers);
router.post("/", protect, authorize("admin", "franchise"), createBuyer);
router.put("/:id", protect, authorize("admin", "franchise"), updateBuyer);
router.delete("/:id", protect, authorize("admin", "franchise"), deleteBuyer);

module.exports = router;
