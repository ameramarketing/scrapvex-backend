const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  minAmount: { type: Number, default: 300 },
  contactEmail: { type: String, default: "support@scrapvex.com" },
  contactPhone: { type: String, default: "9086038222" },
  officeAddress: { type: String, default: "ScrapVex HQ, Jammu & Kashmir, India" },
  workingHours: { type: String, default: "9 AM - 7 PM" },
  facebookUrl: { type: String, default: "#" },
  instagramUrl: { type: String, default: "#" },
  linkedinUrl: { type: String, default: "#" },
  appDownloadLink: { type: String, default: "#" },
  pickupCommissionPercentage: { type: Number, default: 5 },
  upiId: { type: String, default: "scrapvex@okaxis" },

  // NEW DYNAMIC BRAND & OPERATIONAL FIELDS
  brandLogo: { type: String, default: "" },
  favicon: { type: String, default: "" },
  appIcon: { type: String, default: "" },
  heroBanner: { type: String, default: "" },
  brandTagline: { type: String, default: "Jammu & Kashmir Ka Pehla Digital Kabadiwala" },
  isMaintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: "ScrapVex is undergoing scheduled maintenance for upgraded services in J&K. We will be back shortly!" },
  announcementText: { type: String, default: "" },
  referralBonusAmount: { type: Number, default: 50 },
  serviceCharge: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
