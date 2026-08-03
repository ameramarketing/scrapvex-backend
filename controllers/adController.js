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
    const backendHost = process.env.BACKEND_URL || 'http://localhost:5000';
    let imageUrl = req.body.imageUrl || "";
    let mobileImageUrl = req.body.mobileImageUrl || "";

    if (req.file) {
      imageUrl = `${backendHost}/uploads/${req.file.filename}`;
    }
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        imageUrl = `${backendHost}/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.mobileImage && req.files.mobileImage[0]) {
        mobileImageUrl = `${backendHost}/uploads/${req.files.mobileImage[0].filename}`;
      }
    }

    const adData = {
      ...req.body,
      imageUrl,
      mobileImageUrl: mobileImageUrl || imageUrl // Fallback to desktop image if mobile image is not uploaded
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
