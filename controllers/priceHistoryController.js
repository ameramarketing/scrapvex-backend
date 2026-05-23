const PriceHistory = require("../models/PriceHistory");

const logPriceChange = async (scrapItemId, city, oldPrice, newPrice, userId) => {
  try {
    await PriceHistory.create({
      scrapItem: scrapItemId,
      city: city || "global",
      oldPrice,
      newPrice,
      updatedBy: userId
    });
  } catch (error) {
    console.error("PriceHistory Error:", error.message);
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const query = {};
    if (req.query.scrapItemId) query.scrapItem = req.query.scrapItemId;
    if (req.query.city) query.city = req.query.city.toLowerCase();

    const history = await PriceHistory.find(query)
      .populate("scrapItem", "name category")
      .populate("updatedBy", "name role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logPriceChange, getPriceHistory };
