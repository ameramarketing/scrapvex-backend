const Contact = require("../models/Contact");

// @desc    Submit a new contact inquiry
// @route   POST /api/contacts
// @access  Public
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }

    const newMessage = await Contact.create({
      name,
      email,
      phone,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully!",
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all contact messages (Admin Only)
// @route   GET /api/contacts
// @access  Private/Admin
const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update contact status (Admin Only)
// @route   PUT /api/contacts/:id
// @access  Private/Admin
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Please specify status" });
    }

    const message = await Contact.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.status = status;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message status updated to ${status} successfully!`,
      data: message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
  updateContactStatus
};
