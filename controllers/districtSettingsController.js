const DistrictSettings = require("../models/DistrictSettings");

const getDistrictSettings = async (req, res) => {
  try {
    let settings;
    if (req.user.role === "franchise") {
      settings = await DistrictSettings.findOne({ franchiseId: req.user._id });
    } else if (req.query.city) {
      settings = await DistrictSettings.findOne({ city: req.query.city.toLowerCase() });
    }
    res.status(200).json({ success: true, settings: settings || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upsertDistrictSettings = async (req, res) => {
  try {
    const franchiseId = req.user._id;
    const settings = await DistrictSettings.findOneAndUpdate(
      { franchiseId },
      { ...req.body, franchiseId, city: req.body.city?.toLowerCase() || req.user.assignedCity?.toLowerCase() },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: "Settings saved", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDistrictSettings, upsertDistrictSettings };
