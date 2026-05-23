const mongoose = require("mongoose");

const scrapItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ["Paper", "Plastic", "Metal", "Electronic", "Appliances", "Vehicles", "Other"],
    default: "Other"
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: "kg"
  },
  image: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("ScrapItem", scrapItemSchema);
