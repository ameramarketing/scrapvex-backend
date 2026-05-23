const express = require("express");
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require("../controllers/supplierController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "franchise"), getSuppliers);
router.post("/", protect, authorize("admin", "franchise"), createSupplier);
router.put("/:id", protect, authorize("admin", "franchise"), updateSupplier);
router.delete("/:id", protect, authorize("admin", "franchise"), deleteSupplier);

module.exports = router;
