const Supplier = require("../models/Supplier");

const getSuppliers = async (req, res) => {
  try {
    const query = req.user.role === "franchise" ? { franchiseId: req.user._id } : {};
    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const franchiseId = req.user.role === "franchise" ? req.user._id : null;
    const supplier = await Supplier.create({ ...req.body, franchiseId });
    res.status(201).json({ success: true, message: "Supplier added", supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
