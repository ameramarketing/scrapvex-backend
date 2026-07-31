const mongoose = require("mongoose");

const areaVoteSchema = new mongoose.Schema({
  area: { type: String, required: true, trim: true },
  userMobile: { type: String, default: "" },
  ip: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("AreaVote", areaVoteSchema);
