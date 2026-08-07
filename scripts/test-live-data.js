// scripts/test-live-data.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Pickup = require("../models/Pickup");
const WalletTransaction = require("../models/WalletTransaction");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");

const testData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, "name email mobile role");
    const pickups = await Pickup.find();
    const purchases = await Purchase.find();
    const sales = await Sale.find();

    console.log("=== DB COLLECTION COUNTS ===");
    console.log("Users:", users.length, users);
    console.log("Pickups Count:", pickups.length);
    console.log("Purchases Count:", purchases.length);
    console.log("Sales Count:", sales.length);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

testData();
