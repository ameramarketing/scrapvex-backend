// scripts/update-admin-mobile.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Settings = require("../models/Settings");

const updateAdminMobile = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas...");

    // Update Admin User mobile
    const adminUser = await User.findOneAndUpdate(
      { role: "admin" },
      { mobile: "8491028539", email: "admin@scrapvex.com" },
      { new: true }
    );
    console.log("Updated Admin User:", adminUser ? adminUser.mobile : "No Admin user found");

    // Also check if user with mobile 9086038222 exists and update to 8491028539
    await User.updateMany({ mobile: "9086038222" }, { mobile: "8491028539" });

    // Update Settings contactPhone
    const settings = await Settings.findOneAndUpdate(
      {},
      { contactPhone: "8491028539" },
      { new: true }
    );
    console.log("Updated Platform Settings contactPhone:", settings ? settings.contactPhone : "No settings found");

    console.log("✅ Admin Mobile successfully updated to 8491028539 everywhere!");
    process.exit(0);
  } catch (e) {
    console.error("Error updating admin mobile:", e);
    process.exit(1);
  }
};

updateAdminMobile();
