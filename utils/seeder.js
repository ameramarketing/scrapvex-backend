const User = require("../models/User");
const ScrapItem = require("../models/ScrapItem");
const Settings = require("../models/Settings");

const seedInitialData = async () => {
  try {
    // 1. Seed Admin Account if missing
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      await User.create({
        name: "Amjad Khan (Admin)",
        mobile: "9086038222",
        email: "admin@scrapvex.com",
        password: "admin123",
        role: "admin",
        address: "ScrapVex HQ, Rajouri / Jammu, J&K"
      });
      console.log("👑 Auto-Seeded Default Admin Account: Mobile 9086038222 / Pass admin123");
    }

    // 2. Seed Settings if missing
    let settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({});
      console.log("⚙️ Auto-Seeded Default Platform Settings");
    }

    // 3. Seed Scrap Rates if missing
    const itemCount = await ScrapItem.countDocuments();
    if (itemCount === 0) {
      await ScrapItem.insertMany([
        { name: "Newspaper & Paper Raddi", price: 15, unit: "kg", category: "Paper", icon: "📰" },
        { name: "Cardboard & Cartons (Gatta)", price: 12, unit: "kg", category: "Paper", icon: "📦" },
        { name: "Plastic Bottles & Jars", price: 12, unit: "kg", category: "Plastic", icon: "🧴" },
        { name: "Iron & Steel Scrap (Loha)", price: 30, unit: "kg", category: "Metal", icon: "⚙️" },
        { name: "Copper Scrap (Tamba)", price: 650, unit: "kg", category: "Metal", icon: "⚡" },
        { name: "Brass Scrap (Pital)", price: 480, unit: "kg", category: "Metal", icon: "🏆" },
        { name: "Aluminum Scrap", price: 140, unit: "kg", category: "Metal", icon: "🥫" },
        { name: "E-Waste / Old Electronics", price: 40, unit: "kg", category: "Other", icon: "💻" }
      ]);
      console.log("🏷️ Auto-Seeded 8 Default Scrap Rate Items");
    }
  } catch (err) {
    console.error("Seeder Warning:", err.message);
  }
};

module.exports = seedInitialData;
