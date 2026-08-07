// scripts/wipe-test-data.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Pickup = require("../models/Pickup");
const WalletTransaction = require("../models/WalletTransaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Contact = require("../models/Contact");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const SupportTicket = require("../models/SupportTicket");
const AuditLog = require("../models/AuditLog");
const Broadcast = require("../models/Broadcast");
const Ad = require("../models/Ad");
const AreaVote = require("../models/AreaVote");

const wipeData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI not found in .env!");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas!");

    console.log("🧹 Wiping test data...");

    // 1. Delete all test pickups, purchases, sales, inventory
    const p1 = await Pickup.deleteMany({});
    const p2 = await Purchase.deleteMany({});
    const p3 = await Sale.deleteMany({});
    const inv = await Inventory.deleteMany({});

    // 2. Delete all test transactions & withdrawals
    const w1 = await WalletTransaction.deleteMany({});
    const w2 = await WithdrawalRequest.deleteMany({});

    // 3. Delete all test contacts, reviews, notifications, tickets, logs, ads, broadcasts
    const c1 = await Contact.deleteMany({});
    const r1 = await Review.deleteMany({});
    const n1 = await Notification.deleteMany({});
    await SupportTicket.deleteMany({});
    await AuditLog.deleteMany({});
    await Broadcast.deleteMany({});
    await Ad.deleteMany({});
    await AreaVote.deleteMany({});

    // 4. Delete all customer users (role: "user") AND collectors (role: "collector"), preserve "admin" and "franchise"
    const u1 = await User.deleteMany({ role: { $in: ["user", "collector"] } });

    // 5. Reset wallet balances for preserved Franchises & Admins
    await User.updateMany(
      { role: { $in: ["admin", "franchise"] } },
      { $set: { walletBalance: 0, pendingBalance: 0 } }
    );

    console.log(`
✅ CLEANUP COMPLETED SUCCESSFULLY ON MONGODB ATLAS!
----------------------------------------------------
📦 Pickups Deleted: ${p1.deletedCount}
🛒 Purchases Deleted: ${p2.deletedCount}
💰 Sales Deleted: ${p3.deletedCount}
🏬 Inventory Records Deleted: ${inv.deletedCount}
💳 Wallet Transactions Deleted: ${w1.deletedCount}
🏦 Withdrawal Requests Deleted: ${w2.deletedCount}
✉️ Contact Messages Deleted: ${c1.deletedCount}
⭐ Reviews Deleted: ${r1.deletedCount}
🔔 Notifications Deleted: ${n1.deletedCount}
👥 Users & Collectors Deleted: ${u1.deletedCount}
👑 Admins & Franchises Preserved with 0 balance!
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup Error:", error.message);
    process.exit(1);
  }
};

wipeData();
