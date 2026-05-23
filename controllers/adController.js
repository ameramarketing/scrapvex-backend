const Ad = require("../models/Ad");

// GET ALL ADS
exports.getAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE AD
exports.createAd = async (req, res) => {
  try {
    const adData = {
      ...req.body,
      imageUrl: req.file ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}` : req.body.imageUrl
    };
    const ad = await Ad.create(adData);
    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE AD
exports.deleteAd = async (req, res) => {
  try {
    await Ad.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Ad deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// TOGGLE AD STATUS
exports.toggleAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    ad.isActive = !ad.isActive;
    await ad.save();
    res.status(200).json({ success: true, data: ad });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
