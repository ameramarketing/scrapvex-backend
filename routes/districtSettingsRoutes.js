const express = require("express");
const router = express.Router();
const { getDistrictSettings, upsertDistrictSettings } = require("../controllers/districtSettingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "franchise"), getDistrictSettings);
router.post("/", protect, authorize("franchise"), upsertDistrictSettings);

module.exports = router;
