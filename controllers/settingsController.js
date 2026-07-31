const Settings = require("../models/Settings");

// @desc    Get platform settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update platform settings (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    let updateData = { ...req.body };

    if (req.file) {
      updateData.brandLogo = `/uploads/${req.file.filename}`;
    }
    if (req.files) {
      if (req.files.brandLogo && req.files.brandLogo[0]) {
        updateData.brandLogo = `/uploads/${req.files.brandLogo[0].filename}`;
      }
      if (req.files.favicon && req.files.favicon[0]) {
        updateData.favicon = `/uploads/${req.files.favicon[0].filename}`;
      }
      if (req.files.appIcon && req.files.appIcon[0]) {
        updateData.appIcon = `/uploads/${req.files.appIcon[0].filename}`;
      }
      if (req.files.heroBanner && req.files.heroBanner[0]) {
        updateData.heroBanner = `/uploads/${req.files.heroBanner[0].filename}`;
      }
    }

    if (!settings) {
      settings = await Settings.create(updateData);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, updateData, {
        new: true,
        runValidators: true
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
