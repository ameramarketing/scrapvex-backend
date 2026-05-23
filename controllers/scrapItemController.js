const ScrapItem = require("../models/ScrapItem");
const CityRate = require("../models/CityRate");
const User = require("../models/User");

// @desc    Get all scrap items
// @route   GET /api/scrap-items
// @access  Public
exports.getScrapItems = async (req, res) => {
  try {
    const city = req.query.city ? req.query.city.toLowerCase() : "";
    // Use .lean() to get plain JS objects
    const items = await ScrapItem.find({ isActive: true }).lean();
    
    if (city) {
      const cityRates = await CityRate.find({ city }).lean();
      const mergedItems = items.map(item => {
        const cityRate = cityRates.find(cr => cr.scrapItem.toString() === item._id.toString());
        if (cityRate) {
          return { ...item, price: cityRate.price, isCitySpecific: true };
        }
        return item;
      });
      return res.status(200).json({ success: true, count: mergedItems.length, data: mergedItems });
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all cities that have a franchise
// @route   GET /api/scrap-items/cities
// @access  Public
exports.getActiveCities = async (req, res) => {
  try {
    const rawCities = await User.distinct("assignedCity", { role: "franchise", assignedCity: { $ne: "" } });
    // Normalize to lowercase and remove duplicates
    const uniqueCities = [...new Set(rawCities.map(c => c.toLowerCase()))];
    res.status(200).json({ success: true, cities: uniqueCities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new scrap item
// @route   POST /api/scrap-items
// @access  Private/Admin
exports.createScrapItem = async (req, res) => {
  try {
    const item = await ScrapItem.create(req.body);
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a scrap item
// @route   PUT /api/scrap-items/:id
// @access  Private/Admin
exports.updateScrapItem = async (req, res) => {
  try {
    const item = await ScrapItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a scrap item
// @route   DELETE /api/scrap-items/:id
// @access  Private/Admin
exports.deleteScrapItem = async (req, res) => {
  try {
    await ScrapItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
