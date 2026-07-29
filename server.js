// server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const adminRoutes = require("./routes/adminRoutes");
const collectorRoutes = require("./routes/collectorRoutes");

// Load .env
dotenv.config();

// Connect MongoDB
connectDB();

// Initialize WhatsApp Web Gateway
const { initWhatsAppClient } = require("./utils/whatsapp");
initWhatsAppClient();

const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();

/* ==============================
   MIDDLEWARE
 ============================== */
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

// Serve Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ==============================
   HOME ROUTE
============================== */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "🚀 Scrapvex Backend Running Successfully"
  });
});

/* ==============================
   API ROUTES
============================== */
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/pickups",
  pickupRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/collector",
  collectorRoutes
);

app.use(
  "/api/scrap-items",
  require("./routes/scrapItemRoutes")
);

app.use(
  "/api/ads",
  require("./routes/adRoutes")
);

app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/billing", require("./routes/billingRoutes"));

/* NEW MODULE ROUTES */
app.use("/api/buyers", require("./routes/buyerRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/district-settings", require("./routes/districtSettingsRoutes"));
app.use("/api/support-tickets", require("./routes/supportTicketRoutes"));
app.use("/api/broadcasts", require("./routes/broadcastRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/price-history", require("./routes/priceHistoryRoutes"));
app.use("/api/withdrawals", require("./routes/withdrawalRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));

/* ==============================
   404 ROUTE FIXED
============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "Route Not Found"
  });
});

/* ==============================
   SERVER START
============================== */
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🔥 Server Running On Port ${PORT}`
  );
});