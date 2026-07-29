// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Pickup = require("../models/Pickup");
const { sendSMS, buildOtpResponsePayload } = require("../utils/sms");
const { sendWhatsAppOTP } = require("../utils/whatsapp");

/* token generator */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const otpStore = new Map();

/* send OTP for new registration (WhatsApp or SMS) */
const sendRegisterOTP = async (req, res) => {
  try {
    const { mobile, channel = "whatsapp" } = req.body;
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: "Enter valid 10-digit mobile number" });
    }
    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number already registered. Please login!" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(mobile, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    let dispatchResult;
    if (channel === "whatsapp") {
      dispatchResult = await sendWhatsAppOTP(mobile, otp);
    } else {
      dispatchResult = await sendSMS(mobile, `Your ScrapVex Registration OTP is ${otp}. Valid for 10 minutes.`);
    }

    const defaultMsg = channel === "whatsapp" 
      ? `OTP sent to your WhatsApp (+91 ${mobile}) 💬` 
      : `OTP sent via SMS to +91 ${mobile} 📱`;

    const otpResponse = buildOtpResponsePayload(otp, dispatchResult, defaultMsg);
    otpResponse.channel = channel;
    const whatsappMsgText = `🟢 *ScrapVex Verification Code*\n\nYour 4-Digit OTP Code is: *${otp}*\n\nValid for 10 minutes. Do not share with anyone.`;
    otpResponse.whatsappText = whatsappMsgText;
    otpResponse.whatsappLink = `https://api.whatsapp.com/send?phone=91${mobile}&text=${encodeURIComponent(whatsappMsgText)}`;

    res.json(otpResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* register user (Standard for customers) */
const registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password, otp } = req.body;
    if (!name || !mobile || !password || !otp) {
      return res.status(400).json({ message: "Fill all required fields including OTP" });
    }

    const stored = otpStore.get(mobile);
    if (!stored || stored.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please check the 4-digit code sent to your mobile." });
    }
    if (Date.now() > stored.expiresAt) {
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number already exists" });
    }

    otpStore.delete(mobile); // Clear used OTP

    const userData = { name, mobile, password, role: "user" };
    if (email) userData.email = email;
    const user = await User.create(userData);
    
    // Send Welcome SMS
    await sendSMS(mobile, `Welcome to ScrapVex! Your account has been created successfully. Ab raddi bechna hua aasaan!`);

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
    const { name, mobile, email, password, area, otp } = req.body;
    if (!name || !mobile || !password || !area || !otp) {
      return res.status(400).json({ message: "Fill all required fields including OTP and Area" });
    }

    const stored = otpStore.get(mobile);
    if (!stored || stored.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please check the 4-digit code sent to your mobile." });
    }
    if (Date.now() > stored.expiresAt) {
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    otpStore.delete(mobile); // Clear used OTP

    const collectorData = { name, mobile, password, area, role: "collector" };
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

/* forgot password or request OTP (WhatsApp & SMS) */
const forgotPassword = async (req, res) => {
  try {
    const { mobile, channel = "whatsapp" } = req.body;
    let person = await User.findOne({ mobile });
    
    // If person doesn't exist, create a guest account to save the OTP
    if (!person) {
      const name = req.body.name || "Guest User";
      person = await User.create({
        name,
        mobile,
        password: "GuestUserPassword123!", // Dummy password
        role: "user"
      });
    }
    
    // Generate a random 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save OTP in DB with 10 minute expiry
    person.resetOTP = otp;
    person.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await person.save();
    
    let dispatchResult;
    if (channel === "whatsapp") {
      dispatchResult = await sendWhatsAppOTP(mobile, otp);
    } else {
      dispatchResult = await sendSMS(mobile, `Your ScrapVex verification OTP is: ${otp}. Valid for 10 minutes.`);
    }

    const defaultMsg = channel === "whatsapp" 
      ? `Password reset OTP sent to your WhatsApp (+91 ${mobile}) 💬` 
      : `Password reset OTP sent via SMS to +91 ${mobile} 📱`;

    const otpResponse = buildOtpResponsePayload(otp, dispatchResult, defaultMsg);
    otpResponse.channel = channel;
    const whatsappMsgText = `🟢 *ScrapVex Verification Code*\n\nYour 4-Digit OTP Code is: *${otp}*\n\nValid for 10 minutes. Do not share with anyone.`;
    otpResponse.whatsappText = whatsappMsgText;
    otpResponse.whatsappLink = `https://api.whatsapp.com/send?phone=91${mobile}&text=${encodeURIComponent(whatsappMsgText)}`;
    
    res.json(otpResponse);
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

const getWhatsAppQRPage = async (req, res) => {
  try {
    const { getWhatsAppStatus } = require("../utils/whatsapp");
    const { isReady, status, qrCodeUrl } = getWhatsAppStatus();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ScrapVex - WhatsApp Gateway QR Connect</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="5">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #1e293b; padding: 36px; border-radius: 24px; text-align: center; max-width: 440px; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h2 { margin: 10px 0; color: #22c55e; }
            .status-pill { display: inline-block; padding: 8px 16px; border-radius: 999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; background: ${isReady ? '#166534' : '#854d0e'}; color: ${isReady ? '#4ade80' : '#fef08a'}; }
            .qr-img { width: 260px; height: 260px; border-radius: 16px; border: 4px solid #22c55e; background: #fff; padding: 10px; margin: 15px 0; }
            .steps { text-align: left; background: #0f172a; padding: 18px; border-radius: 14px; font-size: 13px; color: #cbd5e1; line-height: 1.6; border: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 50px;">💬</div>
            <h2>ScrapVex WhatsApp Gateway</h2>
            <div class="status-pill">${isReady ? '🟢 CONNECTED & READY' : '⏳ ' + status.toUpperCase()}</div>

            ${isReady ? `
              <div style="padding: 20px; background: #052e16; border-radius: 16px; color: #4ade80; font-weight: bold; margin: 20px 0;">
                🎉 WhatsApp Gateway is 100% Active & Connected! Real WhatsApp OTPs will be sent automatically.
              </div>
            ` : `
              ${qrCodeUrl ? `<img src="${qrCodeUrl}" class="qr-img" alt="WhatsApp QR Code" />` : '<p style="color:#94a3b8">Generating QR Code... Page refreshes every 5 seconds</p>'}
              <div class="steps">
                <b>📱 How to Connect Your WhatsApp (1-Minute):</b><br/>
                1. Open WhatsApp on your mobile phone.<br/>
                2. Tap Menu <b>⋮ (3 dots)</b> or <b>Settings</b>.<br/>
                3. Select <b>Linked Devices</b> -> <b>Link a Device</b>.<br/>
                4. Point your camera at this screen to scan the QR code!
              </div>
            `}
          </div>
        </body>
      </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).send("Error rendering QR page: " + err.message);
  }
};

module.exports = {
  sendRegisterOTP,
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
  toggleOnlineStatus,
  getWhatsAppQRPage
};