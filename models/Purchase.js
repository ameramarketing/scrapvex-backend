const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // null means it belongs to super admin
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    default: null
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  supplierContact: {
    type: String,
    default: ""
  },
  items: [{
    scrapItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapItem",
      required: true
    },
    name: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Paid"
  },
  paymentMethod: {
    type: String,
    default: "Cash"
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
