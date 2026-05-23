const Buyer = require("../models/Buyer");

const getBuyers = async (req, res) => {
  try {
    const query = req.user.role === "franchise" ? { franchiseId: req.user._id } : {};
    const buyers = await Buyer.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, buyers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBuyer = async (req, res) => {
  try {
    const franchiseId = req.user.role === "franchise" ? req.user._id : null;
    const buyer = await Buyer.create({ ...req.body, franchiseId });
    res.status(201).json({ success: true, message: "Buyer added", buyer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, buyer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBuyer = async (req, res) => {
  try {
    await Buyer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Buyer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBuyers, createBuyer, updateBuyer, deleteBuyer };
