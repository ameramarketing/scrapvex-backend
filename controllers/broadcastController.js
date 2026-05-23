const Broadcast = require("../models/Broadcast");
const { createNotify } = require("./notificationController");
const User = require("../models/User");

const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .populate("sentBy", "name role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, broadcasts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.create({ ...req.body, sentBy: req.user._id });

    // Send notifications to target audience
    let targetQuery = {};
    if (req.body.target === "Users") targetQuery.role = "user";
    else if (req.body.target === "Collectors") targetQuery.role = "collector";
    else if (req.body.target === "Franchises") targetQuery.role = "franchise";

    const targetUsers = await User.find(targetQuery);
    for (const u of targetUsers) {
      createNotify(u._id, u.role === "user" ? "User" : u.role === "collector" ? "Collector" : "User", req.body.title, req.body.message, "info");
    }

    res.status(201).json({ success: true, message: `Broadcast sent to ${targetUsers.length} users`, broadcast });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBroadcast = async (req, res) => {
  try {
    await Broadcast.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Broadcast deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBroadcasts, createBroadcast, deleteBroadcast };
