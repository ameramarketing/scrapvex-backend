const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("../models/Admin");
const Collector = require("../models/Collector");

dotenv.config();

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Create Admin
    const adminExists = await Admin.findOne({ email: "admin@scrapvex.com" });
    if (!adminExists) {
      await Admin.create({
        name: "Super Admin",
        email: "admin@scrapvex.com",
        password: "admin123", // Password will be hashed by model pre-save hook
        role: "admin"
      });
      console.log("✅ Admin Created: admin@scrapvex.com / admin123");
    } else {
      console.log("ℹ️ Admin already exists.");
    }

    // 2. Create Collector
    const collectorExists = await Collector.findOne({ mobile: "8491028539" });
    if (!collectorExists) {
      await Collector.create({
        name: "Rahul Collector",
        mobile: "8491028539",
        email: "rahul@scrapvex.com",
        password: "collector123", // Hashed by model
        vehicleType: "Mini Truck",
        vehicleNumber: "JK02-1234",
        area: "Rajouri",
        role: "collector"
      });
      console.log("✅ Collector Created: 8491028539 / collector123");
    } else {
      console.log("ℹ️ Collector already exists.");
    }

    process.exit();
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  }
};

createUsers();
