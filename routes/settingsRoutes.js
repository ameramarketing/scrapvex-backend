const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get("/", getSettings);
router.put(
  "/", 
  protect, 
  authorize("admin"), 
  upload.fields([
    { name: "brandLogo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "appIcon", maxCount: 1 },
    { name: "heroBanner", maxCount: 1 },
    { name: "mobileHeroBanner", maxCount: 1 }
  ]), 
  updateSettings
);

module.exports = router;
