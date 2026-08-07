// scripts/check-settings.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Settings = require("../models/Settings");

const checkSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const settings = await Settings.findOne();
    console.log("=== CURRENT DATABASE SETTINGS ===");
    console.log(settings);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

checkSettings();
