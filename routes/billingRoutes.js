const express = require("express");
const router = express.Router();
const {
  getAccountingStats,
  getInventory,
  getSales,
  createSale,
  getPurchases,
  createPurchase,
  editPurchase,
  getPurchasesBySupplier,
  sendPurchaseBillOnWhatsApp
} = require("../controllers/billingController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/stats", protect, authorize("admin", "franchise"), getAccountingStats);
router.get("/inventory", protect, authorize("admin", "franchise"), getInventory);
router.get("/sales", protect, authorize("admin", "franchise"), getSales);
router.post("/sales", protect, authorize("admin", "franchise"), createSale);
router.get("/purchases/by-supplier", protect, authorize("admin", "franchise"), getPurchasesBySupplier);
router.get("/purchases", protect, authorize("admin", "franchise"), getPurchases);
router.post("/purchases", protect, authorize("admin", "franchise"), createPurchase);
router.put("/purchases/:id", protect, authorize("admin", "franchise"), editPurchase);
router.post("/purchases/:id/send-bill", protect, authorize("admin", "franchise"), sendPurchaseBillOnWhatsApp);

module.exports = router;
