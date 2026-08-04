const ScrapItem = require("../models/ScrapItem");
const CityRate = require("../models/CityRate");
const User = require("../models/User");

// @desc    Get all scrap items
// @route   GET /api/scrap-items
// @access  Public
exports.getScrapItems = async (req, res) => {
  try {
    const city = req.query.city ? req.query.city.trim().toLowerCase() : "";
    let items = await ScrapItem.find({ isActive: { $ne: false } }).lean();

    // Auto-seed comprehensive scrap items list if DB has incomplete list
    if (items.length < 15) {
      const defaultItemsToSeed = [
        { name: "Office Paper", category: "Paper", price: 14, unit: "kg" },
        { name: "Newspaper", category: "Paper", price: 15, unit: "kg" },
        { name: "Books", category: "Paper", price: 12, unit: "kg" },
        { name: "Cardboard", category: "Paper", price: 8, unit: "kg" },
        { name: "Iron / Loha", category: "Metal", price: 25, unit: "kg" },
        { name: "Steel", category: "Metal", price: 42, unit: "kg" },
        { name: "Copper / Tamba", category: "Metal", price: 505, unit: "kg" },
        { name: "Brass / Peetal", category: "Metal", price: 325, unit: "kg" },
        { name: "Aluminium", category: "Metal", price: 112, unit: "kg" },
        { name: "Plastic", category: "Plastic", price: 5, unit: "kg" },
        { name: "Pet Bottles", category: "Plastic", price: 10, unit: "kg" },
        { name: "Semi Auto Washing Machine", category: "Appliances", price: 800, unit: "unit" },
        { name: "Single Door Fridge", category: "Appliances", price: 1100, unit: "unit" },
        { name: "AC 1.5 Ton", category: "Appliances", price: 4500, unit: "unit" },
        { name: "Inverter Battery", category: "Appliances", price: 81, unit: "kg" },
        { name: "Laptop", category: "Electronic", price: 500, unit: "unit" },
        { name: "Computer CPU", category: "Electronic", price: 400, unit: "unit" },
        { name: "Bike / Scooter Scrap", category: "Vehicles", price: 3500, unit: "unit" },
        { name: "Car Scrap", category: "Vehicles", price: 18000, unit: "unit" }
      ];

      for (const item of defaultItemsToSeed) {
        await ScrapItem.updateOne(
          { name: item.name },
          { $setOnInsert: item },
          { upsert: true }
        );
      }
      items = await ScrapItem.find({ isActive: { $ne: false } }).lean();
    }
    
    if (city) {
      const cityRates = await CityRate.find({ city: new RegExp(`^${city}$`, "i") }).lean();
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
    let uniqueCities = [...new Set(rawCities.map(c => c.toLowerCase()))];
    
    // If no franchise cities exist yet, return a default city so the app works
    if (uniqueCities.length === 0) {
      uniqueCities = ["rajouri"];
    }
    
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
