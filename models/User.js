const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    unique: true, 
    sparse: true, // Allows multiple null/empty values while enforcing uniqueness for actual emails
    lowercase: true 
  },
  password: { type: String, required: true },
  address: { type: String, default: "" },
  area: { type: String, default: "" }, // For collectors
  assignedCity: { type: String, default: "" }, // For franchise
  role: { 
    type: String, 
    enum: ["user", "collector", "franchise", "admin"],
    default: "user" 
  },
  isOnline: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  walletBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  withdrawalOTP: { type: String, default: "" },
  withdrawalOTPExpires: { type: Date },
  profilePhoto: { type: String, default: "" }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();

  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);