const Review = require("../models/Review");
const Pickup = require("../models/Pickup");
const { createNotify } = require("./notificationController");

// @desc    Create a new review
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { pickupId, rating, comment } = req.body;
    const pickup = await Pickup.findById(pickupId);

    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup not found" });
    }

    if (!pickup.collector) {
      return res.status(400).json({ success: false, message: "No collector assigned to this pickup" });
    }

    const review = await Review.create({
      user: req.user._id,
      collector: pickup.collector,
      pickup: pickupId,
      rating,
      comment
    });

    pickup.isReviewed = true;
    await pickup.save();

    // Notify Collector
    createNotify(
      pickup.collector,
      "Collector",
      "New Review Received",
      `A user gave you a ${rating}-star rating for pickup #${pickupId.toString().slice(-6)}.`,
      "success"
    );

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name mobile")
      .populate("collector", "name mobile")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get collector reviews
// @route   GET /api/reviews/collector/:id
exports.getCollectorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ collector: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
