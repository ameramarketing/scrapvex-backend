const mongoose = require("mongoose");

const districtSettingsSchema = new mongoose.Schema({
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  city: { type: String, required: true },
  minOrderAmount: { type: Number, default: 300 },
  contactPhone: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  officeAddress: { type: String, default: "" },
  isAcceptingOrders: { type: Boolean, default: true },
  operatingHours: { type: String, default: "9:00 AM - 7:00 PM" }
}, { timestamps: true });

module.exports = mongoose.model("DistrictSettings", districtSettingsSchema);
