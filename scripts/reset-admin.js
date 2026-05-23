const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("../models/Admin");

dotenv.config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Find and Update Admin
    const admin = await Admin.findOne({ email: "admin@scrapvex.com" });
    if (admin) {
      admin.password = "admin123";
      await admin.save();
      console.log("✅ Admin Password Reset Successful!");
      console.log("Email: admin@scrapvex.com");
      console.log("Password: admin123");
    } else {
      await Admin.create({
        name: "Super Admin",
        email: "admin@scrapvex.com",
        password: "admin123",
        role: "admin"
      });
      console.log("✅ Admin Account Created Freshly!");
    }

    process.exit();
  } catch (error) {
    console.error("❌ Reset Error:", error.message);
    process.exit(1);
  }
};

resetAdmin();
