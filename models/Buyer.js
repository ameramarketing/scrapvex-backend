const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema({
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
  email: String,
  address: String,
  gstin: String,
  pan: String,
  state: { type: String, default: "Jammu & Kashmir" },
  stateCode: { type: String, default: "01" },
  isConsignee: { type: Boolean, default: false } // Can be used as ship-to address
}, { timestamps: true });

module.exports = mongoose.model("Buyer", buyerSchema);
