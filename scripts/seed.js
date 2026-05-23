const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ScrapItem = require("./models/ScrapItem");

dotenv.config();

const items = [
  // Normal Recyclables
  { name: "Office Paper", category: "Paper", price: 14, unit: "kg" },
  { name: "Newspaper", category: "Paper", price: 15, unit: "kg" },
  { name: "Books", category: "Paper", price: 12, unit: "kg" },
  { name: "Cardboard", category: "Paper", price: 8, unit: "kg" },
  { name: "Iron / Loha", category: "Metal", price: 25, unit: "kg" },
  { name: "Steel", category: "Metal", price: 42, unit: "kg" },
  { name: "Copper / Tamba", category: "Metal", price: 505, unit: "kg" },
  { name: "Brass / Peetal", category: "Metal", price: 325, unit: "kg" },
  { name: "Aluminium", category: "Metal", price: 112, unit: "kg" },
  { name: "Plastic", category: "Plastic", price: 5, unit: "kg" },
  { name: "Pet Bottles", category: "Plastic", price: 10, unit: "kg" },

  // Large Appliances
  { name: "Semi Auto Washing Machine", category: "Appliances", price: 800, unit: "unit" },
  { name: "Fully Auto Washing Machine", category: "Appliances", price: 1350, unit: "unit" },
  { name: "Single Door Fridge", category: "Appliances", price: 1100, unit: "unit" },
  { name: "Double Door Fridge", category: "Appliances", price: 1350, unit: "unit" },
  { name: "Side by Side Fridge", category: "Appliances", price: 2700, unit: "unit" },
  { name: "AC 1 Ton", category: "Appliances", price: 3500, unit: "unit" },
  { name: "AC 1.5 Ton", category: "Appliances", price: 4500, unit: "unit" },
  { name: "Battery", category: "Appliances", price: 81, unit: "kg" },

  // IT E-Waste
  { name: "Laptop", category: "Electronic", price: 500, unit: "unit" },
  { name: "Computer CPU", category: "Electronic", price: 400, unit: "unit" },
  { name: "Tablet", category: "Electronic", price: 40, unit: "unit" },
  { name: "CRT TV", category: "Electronic", price: 200, unit: "unit" },

  // Vehicle Scrap
  { name: "Bike", category: "Vehicles", price: 2500, unit: "unit" },
  { name: "Scooty", category: "Vehicles", price: 1800, unit: "unit" },
  { name: "Car", category: "Vehicles", price: 20000, unit: "unit" }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    await ScrapItem.deleteMany();
    console.log("Existing items cleared.");

    await ScrapItem.insertMany(items);
    console.log("Sample Scrap Items seeded successfully! 🌱");

    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
