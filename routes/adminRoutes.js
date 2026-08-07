// routes/adminRoutes.js

const express = require("express");

const router =
  express.Router();

const {
  getDashboardStats,
  getAllPickups,
  updatePickupStatus,
  assignPickup,
  deletePickup,
  createCollector,
  getAllCollectors,
  deleteCollector,
  createUser,
  getAllUsers,
  deleteUser,
  resetPassword,
  addScrapItem,
  updateScrapItem,
  deleteScrapItem,
  getWalletStats,
  getAllTransactions,
  updateUserWallet,
  createFranchise,
  getAllFranchises,
  deleteFranchise,
  updateCityRate,
  getCityRates,
  approveDeposit,
  rejectDeposit,
  cleanTestData
} = require(
  "../controllers/adminController"
);

const {
  protect,
  authorize
} = require(
  "../middleware/authMiddleware"
);

/* Clean Test Data (Preserve Franchise & Admin) */
router.post("/clean-test-data", protect, authorize("admin"), cleanTestData);

/* ==================================
   ADMIN ONLY ROUTES
================================== */

/* Dashboard Stats */
router.get(
  "/dashboard",
  protect,
  authorize("admin", "franchise"),
  getDashboardStats
);

/* Get All Pickups */
router.get(
  "/pickups",
  protect,
  authorize("admin", "franchise"),
  getAllPickups
);

/* Update Pickup Status */
router.put(
  "/pickup/:id/status",
  protect,
  authorize("admin", "franchise"),
  updatePickupStatus
);

router.post(
  "/assign-pickup",
  protect,
  authorize("admin", "franchise"),
  assignPickup
);

/* Delete Pickup */
router.delete(
  "/pickup/:id",
  protect,
  authorize("admin"),
  deletePickup
);

/* Manage Collectors */
router.post("/collectors", protect, authorize("admin", "franchise"), createCollector);
router.get("/collectors", protect, authorize("admin", "franchise"), getAllCollectors);
router.delete("/collectors/:id", protect, authorize("admin", "franchise"), deleteCollector);

/* Manage Users */
router.post("/users", protect, authorize("admin", "franchise"), createUser);
router.get("/users", protect, authorize("admin", "franchise"), getAllUsers);
router.delete("/users/:id", protect, authorize("admin", "franchise"), deleteUser);
router.post("/reset-password", protect, authorize("admin", "franchise"), resetPassword);

/* Manage Franchises */
router.post("/franchises", protect, authorize("admin"), createFranchise);
router.get("/franchises", protect, authorize("admin"), getAllFranchises);
router.delete("/franchises/:id", protect, authorize("admin"), deleteFranchise);

/* Manage Scrap Items (Rates) */
router.post("/scrap-items", protect, authorize("admin"), addScrapItem);
router.put("/scrap-items/:id", protect, authorize("admin"), updateScrapItem);
router.delete("/scrap-items/:id", protect, authorize("admin"), deleteScrapItem);

/* Wallet Management */
router.get("/wallet-stats", protect, authorize("admin", "franchise"), getWalletStats);
router.get("/transactions", protect, authorize("admin", "franchise"), getAllTransactions);
router.post("/update-wallet", protect, authorize("admin", "franchise"), updateUserWallet);

/* City Specific Rates */
router.post("/update-city-rate", protect, authorize("admin", "franchise"), updateCityRate);
router.get("/get-city-rates", protect, authorize("admin", "franchise"), getCityRates);

/* Deposit Requests Approval */
router.post("/deposit/:id/approve", protect, authorize("admin"), approveDeposit);
router.post("/deposit/:id/reject", protect, authorize("admin"), rejectDeposit);

module.exports =
  router;