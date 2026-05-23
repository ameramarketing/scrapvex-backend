const express = require("express");
const router = express.Router();
const { getAds, createAd, deleteAd, toggleAd } = require("../controllers/adController");

const multer = require("multer");
const path = require("path");

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAds);
router.post("/", protect, authorize("admin"), upload.single("image"), createAd);
router.delete("/:id", protect, authorize("admin"), deleteAd);
router.patch("/:id/toggle", protect, authorize("admin"), toggleAd);

module.exports = router;
