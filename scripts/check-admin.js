const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const email = "admin@scrapvex.com";
    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      console.log("❌ Admin NOT found. Creating now...");
      // Mobile is required in User model
      await User.create({
        name: "Super Admin",
        email: email,
        mobile: "0000000000",
        password: "admin123",
        role: "admin"
      });
      console.log("✅ Admin created: admin@scrapvex.com / admin123");
    } else {
      console.log("✅ Admin found in database.");
      const match = await bcrypt.compare("admin123", admin.password);
      console.log("🔑 Password 'admin123' match check:", match ? "SUCCESS" : "FAILED");
      
      if (!match) {
        console.log("🔄 Resetting password to 'admin123'...");
        admin.password = "admin123";
        await admin.save();
        console.log("✅ Password reset successfully.");
      }
    }

    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

check();
