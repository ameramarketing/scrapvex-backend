const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema({
  scrapItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScrapItem",
    required: true
  },
  city: {
    type: String, // "global" for base price, or specific city name
    default: "global"
  },
  oldPrice: Number,
  newPrice: Number,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
