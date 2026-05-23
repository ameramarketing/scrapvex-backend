const express = require("express");
const router = express.Router();
const { createReview, getCollectorReviews, getAllReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReview);
router.get("/", protect, getAllReviews);
router.get("/collector/all", protect, getAllReviews);
router.get("/collector/:id", getCollectorReviews);

module.exports = router;
