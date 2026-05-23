const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // null means it belongs to super admin
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    default: null
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  irn: { type: String, default: "" },
  ackNo: { type: String, default: "" },
  ackDate: { type: String, default: "" },

  // Buyer (Bill To)
  buyerName: { type: String, required: true, trim: true },
  buyerContact: { type: String, default: "" },
  buyerAddress: { type: String, default: "" },
  buyerGSTIN: { type: String, default: "" },
  buyerPAN: { type: String, default: "" },
  buyerState: { type: String, default: "" },
  buyerStateCode: { type: String, default: "" },

  // Consignee (Ship To)
  consigneeName: { type: String, default: "" },
  consigneeAddress: { type: String, default: "" },
  consigneeGSTIN: { type: String, default: "" },
  consigneePAN: { type: String, default: "" },
  consigneeState: { type: String, default: "" },
  consigneeStateCode: { type: String, default: "" },

  // Shipping / Dispatch Details
  eWayBillNo: { type: String, default: "" },
  dispatchDocNo: { type: String, default: "" },
  dispatchedThrough: { type: String, default: "" },
  motorVehicleNo: { type: String, default: "" },
  deliveryNote: { type: String, default: "" },
  deliveryNoteDate: { type: String, default: "" },
  referenceNo: { type: String, default: "" },
  buyersOrderNo: { type: String, default: "" },
  destination: { type: String, default: "" },
  termsOfDelivery: { type: String, default: "" },

  items: [{
    scrapItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapItem"
    },
    name: String,
    hsnCode: { type: String, default: "" },
    quantity: Number,
    rate: Number,
    amount: Number,
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 }
  }],
  totalTaxableAmount: { type: Number, default: 0 },
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
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

module.exports = mongoose.model("Sale", saleSchema);
