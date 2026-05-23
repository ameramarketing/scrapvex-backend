const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  minAmount: { type: Number, default: 300 },
  contactEmail: { type: String, default: "support@scrapvex.com" },
  contactPhone: { type: String, default: "9086038222" },
  officeAddress: { type: String, default: "Scrapvex HQ, Delhi, India" },
  workingHours: { type: String, default: "9 AM - 7 PM" },
  facebookUrl: { type: String, default: "#" },
  instagramUrl: { type: String, default: "#" },
  linkedinUrl: { type: String, default: "#" },
  appDownloadLink: { type: String, default: "#" },
  pickupCommissionPercentage: { type: Number, default: 5 }, // Platform commission % per pickup
  upiId: { type: String, default: "scrapvex@okaxis" }
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
