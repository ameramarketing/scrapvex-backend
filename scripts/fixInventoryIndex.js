const mongoose = require("mongoose");
require("dotenv").config();

const dropOldIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scrapvex");
    console.log("Connected to MongoDB");
    
    const collection = mongoose.connection.collection("inventories");
    
    // List indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));
    
    if (indexes.some(i => i.name === "scrapItem_1")) {
      await collection.dropIndex("scrapItem_1");
      console.log("Dropped old unique index 'scrapItem_1'");
    } else {
      console.log("Index 'scrapItem_1' not found or already dropped");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

dropOldIndex();
