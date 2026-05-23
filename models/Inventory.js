const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // null means it belongs to super admin
  },
  scrapItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScrapItem",
    required: true
  },
  quantityAvailable: {
    type: Number,
    default: 0
  },
  totalBoughtQuantity: {
    type: Number,
    default: 0
  },
  totalSoldQuantity: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

inventorySchema.index({ franchiseId: 1, scrapItem: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
