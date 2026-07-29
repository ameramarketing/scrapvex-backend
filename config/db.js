const mongoose = require("mongoose");
const seedInitialData = require("../utils/seeder");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scrapvex";
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto seed initial Admin, Settings & Scrap Rates
    await seedInitialData();

  } catch (error) {
    console.error("❌ MongoDB Connection Warning:", error.message);
    if (process.env.NODE_ENV === 'production') {
      console.log("⚠️ Server continuing in fallback mode...");
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;