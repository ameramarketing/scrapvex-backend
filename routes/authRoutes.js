// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const authController = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

/* Public Routes */
router.post(
  "/register",
  authController.registerUser
);

router.post(
  "/collector-register",
  authController.registerCollector
);

router.post(
  "/login",
  authController.loginUser
);

router.post(
  "/collector-login",
  authController.loginCollector
);

router.post(
  "/admin-login",
  authController.loginAdmin
);

router.post(
  "/franchise-login",
  authController.loginFranchise
);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

/* Protected Routes */
router.get(
  "/profile",
  protect,
  authController.getProfile
);

router.put(
  "/profile",
  protect,
  upload.single("profilePhoto"),
  authController.updateProfile
);

router.put(
  "/toggle-status",
  protect,
  authController.toggleOnlineStatus
);

module.exports = router;