const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String, // e.g., "DELETE_USER", "UPDATE_RATE", "LOGIN"
    required: true
  },
  module: {
    type: String, // e.g., "USER_MGMT", "RATES", "AUTH"
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed // JSON object of what changed
  },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
