const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  target: {
    type: String,
    enum: ["All", "Users", "Collectors", "Franchises"],
    default: "All"
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isPushNotification: {
    type: Boolean,
    default: true
  },
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Broadcast", broadcastSchema);
