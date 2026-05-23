const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // Super Admin if null
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["General", "Payment", "Pickup", "Collector", "Technical", "Pickup Issue", "Payment Issue", "Franchise Inquiry", "Complaint"],
    default: "General"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open"
  },
  replies: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
