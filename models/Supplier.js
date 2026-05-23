const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true
  },
  address: String,
  gstin: String,
  category: { type: String, enum: ["Individual", "Business"], default: "Individual" }
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);
