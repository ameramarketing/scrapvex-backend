const mongoose = require("mongoose");

const cityRateSchema = new mongoose.Schema({
  scrapItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScrapItem",
    required: true
  },
  city: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Ensure unique rate per item per city
cityRateSchema.index({ scrapItem: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("CityRate", cityRateSchema);
