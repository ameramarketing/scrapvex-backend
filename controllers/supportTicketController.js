const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");
const Notification = require("../models/Notification");

const getTickets = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "user" || req.user.role === "collector") query.user = req.user._id;
    else if (req.user.role === "franchise") {
      query = { $or: [{ user: req.user._id }, { franchiseId: req.user._id }] };
    }

    const tickets = await SupportTicket.find(query)
      .populate("user", "name mobile")
      .populate("replies.sender", "name role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      ...req.body,
      user: req.user._id
    });

    // Notify all admins about the new support ticket
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        onModel: "User",
        title: "New Support Ticket Raised",
        message: `A new ticket "${ticket.subject}" has been raised by ${req.user.name} (${req.user.role}).`,
        type: "general"
      });
    }

    res.status(201).json({ success: true, message: "Ticket created", ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const replyToTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    ticket.replies.push({ sender: req.user._id, message: req.body.message });
    if (req.body.status) ticket.status = req.body.status;
    await ticket.save();

    // Notify the user who raised the ticket
    await Notification.create({
      recipient: ticket.user,
      onModel: "User",
      title: "Support Ticket Replied",
      message: `Admin replied to your ticket: "${ticket.subject}".`,
      type: "general"
    });

    res.status(200).json({ success: true, message: "Reply added", ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTickets, createTicket, replyToTicket, updateTicketStatus, deleteTicket };
