/**
 * TESTING RESET SCRIPT
 * 
 * Kya karega:
 * 1. Completed + Assigned pickups delete
 * 2. Sab users ka walletBalance = 0, pendingBalance = 0
 * 3. Sab wallet transactions delete
 * 4. Inventory reset (quantities 0)
 * 5. Sales + Purchases records delete
 */

const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/scrapvex";

// ---- SCHEMAS (inline taaki models load hon) ----
const userSchema = new mongoose.Schema({
  name: String, mobile: String, role: String,
  walletBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
}, { timestamps: true });

const pickupSchema = new mongoose.Schema({
  status: String,
  name: String,
  city: String,
}, { timestamps: true });

const walletTransactionSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  amount: Number,
  type: String,
  status: String,
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
  scrapItem: mongoose.Schema.Types.ObjectId,
  quantityAvailable: { type: Number, default: 0 },
  totalBoughtQuantity: { type: Number, default: 0 },
  totalSoldQuantity: { type: Number, default: 0 },
}, { timestamps: true });

const saleSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const purchaseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

async function main() {
  console.log("\n🚀 Scrapvex Testing Reset Script\n");
  console.log("📡 MongoDB se connect ho raha hai...");
  
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!\n");

  const User = mongoose.model("User", userSchema);
  const Pickup = mongoose.model("Pickup", pickupSchema);
  const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);
  const Inventory = mongoose.model("Inventory", inventorySchema);
  const Sale = mongoose.model("Sale", saleSchema);
  const Purchase = mongoose.model("Purchase", purchaseSchema);

  // ── 1. Delete Completed + Assigned pickups ──
  const pickupResult = await Pickup.deleteMany({
    status: { $in: ["Completed", "Assigned", "Accepted", "Rejected"] }
  });
  console.log(`🗑️  Pickups deleted (Completed/Assigned/Accepted/Rejected): ${pickupResult.deletedCount}`);

  // ── 2. Reset ALL wallets to 0 ──
  const walletResult = await User.updateMany(
    {}, // sab users
    { $set: { walletBalance: 0, pendingBalance: 0 } }
  );
  console.log(`💰 Wallets reset to ₹0: ${walletResult.modifiedCount} users`);

  // ── 3. Delete all wallet transactions ──
  const txResult = await WalletTransaction.deleteMany({});
  console.log(`📋 Wallet transactions deleted: ${txResult.deletedCount}`);

  // ── 4. Reset inventory quantities ──
  const invResult = await Inventory.updateMany(
    {},
    { $set: { quantityAvailable: 0, totalBoughtQuantity: 0, totalSoldQuantity: 0 } }
  );
  console.log(`📦 Inventory reset: ${invResult.modifiedCount} items`);

  // ── 5. Delete all Sales & Purchases ──
  const salesResult = await Sale.deleteMany({});
  const purchResult = await Purchase.deleteMany({});
  console.log(`🧾 Sales records deleted: ${salesResult.deletedCount}`);
  console.log(`🧾 Purchase records deleted: ${purchResult.deletedCount}`);

  // ── Summary ──
  const remainingPickups = await Pickup.countDocuments();
  const allUsers = await User.find({}).select("name role walletBalance");
  
  console.log("\n═══════════════════════════════════════");
  console.log("✅ RESET COMPLETE - Testing Ready!");
  console.log("═══════════════════════════════════════");
  console.log(`📌 Remaining pickups (Pending only): ${remainingPickups}`);
  console.log("\n👥 User Wallet Status:");
  allUsers.forEach(u => {
    console.log(`   [${u.role.toUpperCase()}] ${u.name} → ₹${u.walletBalance}`);
  });
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Ab testing shuru karo! 🎯\n");
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
