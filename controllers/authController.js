// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Pickup = require("../models/Pickup");
const { sendSMS } = require("../utils/sms");

/* token generator */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/* register user (Standard for customers) */
const registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Fill all required fields" });
    }
    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number already exists" });
    }
    const userData = { name, mobile, password, role: "user" };
    if (email) userData.email = email;
    const user = await User.create(userData);
    
    // Send Welcome SMS
    await sendSMS(mobile, `Welcome to Scrapvex! Your account has been created successfully. Ab raddi bechna hua aasaan!`);

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, mobile: user.mobile, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* register collector (Self-registration for collectors) */
const registerCollector = async (req, res) => {
  try {
    const { name, mobile, email, password, area } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Fill all required fields" });
    }
    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }
    const collectorData = { name, mobile, password, area: area || "", role: "collector" };
    if (email) collectorData.email = email;
    const user = await User.create(collectorData);
    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, mobile: user.mobile, email: user.email, area: user.area, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* user login (Customers Only) */
const loginUser = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile, role: "user" });
    if (!user) return res.status(400).json({ message: "User account not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { ...user._doc, password: "" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* collector login (Collectors Only) */
const loginCollector = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile, role: "collector" });
    if (!user) return res.status(400).json({ message: "Collector account not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { ...user._doc, password: "" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* admin login (Search by email) */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user) return res.status(400).json({ message: "Admin account not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    res.json({
      success: true,
      token: generateToken(user._id, "admin"),
      user: { ...user._doc, password: "" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* franchise login (Search by email or mobile) */
const loginFranchise = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    let query = { role: "franchise" };
    if (email) query.email = email;
    else if (mobile) query.mobile = mobile;
    else return res.status(400).json({ message: "Provide email or mobile" });

    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ message: "Franchise account not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    res.json({
      success: true,
      token: generateToken(user._id, "franchise"),
      user: { ...user._doc, password: "" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* forgot password */
const forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    const person = await User.findOne({ mobile });
    if (!person) return res.status(404).json({ success: false, message: "No account found" });
    
    // Generate a random 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save OTP in DB with 10 minute expiry
    person.resetOTP = otp;
    person.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await person.save();
    
    await sendSMS(mobile, `Your Scrapvex password reset OTP is: ${otp}. Valid for 10 minutes. Do not share.`);
    
    res.json({ success: true, message: "OTP sent successfully via SMS" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* verify OTP */
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const person = await User.findOne({ mobile });
    if (!person) return res.status(404).json({ success: false, message: "Account not found" });
    
    if (!person.resetOTP || person.resetOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (person.resetOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }
    
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* reset password */
const resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    const person = await User.findOne({ mobile });
    if (!person) return res.status(404).json({ success: false, message: "Account not found" });
    
    // Verify OTP one more time before resetting password
    if (!person.resetOTP || person.resetOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (person.resetOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }
    
    person.password = newPassword;
    // Clear OTP after use
    person.resetOTP = "";
    person.resetOTPExpires = null;
    await person.save();
    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => res.json(req.user);

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update basic fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.address) user.address = req.body.address;
    if (req.body.area) user.area = req.body.area;

    // Handle profile photo upload
    if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Handle password change
    if (req.body.oldPassword && req.body.newPassword) {
      const match = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!match) {
        return res.status(400).json({ success: false, message: "Incorrect old password" });
      }
      // Password will be hashed in the pre-save hook of the User model
      user.password = req.body.newPassword;
    }

    await user.save();
    
    // Don't send password back to client
    const updatedUser = { ...user._doc, password: "" };
    res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleOnlineStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isOnline) {
      const activePickups = await Pickup.findOne({ collector: user._id, status: "Accepted" });
      if (activePickups) {
        return res.status(400).json({ success: false, message: "Finish your active pickup before going offline!" });
      }
    }

    user.isOnline = !user.isOnline;
    await user.save();
    res.json({ success: true, isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  registerCollector,
  loginUser,
  loginCollector,
  loginAdmin,
  loginFranchise,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
  toggleOnlineStatus
};