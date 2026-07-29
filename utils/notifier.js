const { sendWhatsAppOTP } = require('./whatsapp');
const { sendSMS } = require('./sms');

/**
 * Sends Credentials via WhatsApp and SMS when any user account is created.
 */
const sendWelcomeCredentialsNotification = async ({ name, mobile, role = "user", password }) => {
  const roleTitle = role.toUpperCase();
  const loginUrl = "https://scrapvex.netlify.app";

  const waText = `🟢 *Welcome to ScrapVex!*\n\nDear *${name || 'User'}*, your *${roleTitle}* account has been created successfully! 🎉\n\n📱 *Mobile / Username*: ${mobile}\n🔑 *Password*: ${password}\n\n🌐 *Login Now*: ${loginUrl}\n\nKeep your credentials safe!`;
  const smsText = `ScrapVex: Welcome ${name || 'User'}! Your ${roleTitle} account is created. Mobile: ${mobile}, Password: ${password}. Login: ${loginUrl}`;

  console.log(`\n======================================================`);
  console.log(`📲 [CREDENTIALS NOTIFIER] Sending Login Credentials to +91 ${mobile}`);
  console.log(`Role: ${roleTitle} | Password: ${password}`);
  console.log(`======================================================\n`);

  try {
    await sendWhatsAppOTP(mobile, waText);
  } catch (e) {
    console.error("WhatsApp welcome dispatch error:", e.message);
  }

  try {
    await sendSMS(mobile, smsText);
  } catch (e) {
    console.error("SMS welcome dispatch error:", e.message);
  }
};

/**
 * Sends Transaction & Pickup Status Updates via WhatsApp and SMS
 */
const sendPickupTransactionNotification = async ({ mobile, name, pickupId, status, amount }) => {
  const formattedStatus = status ? status.toUpperCase() : "UPDATED";
  const amountStr = amount ? `₹${amount}` : "Pending Evaluation";

  const waText = `🟢 *ScrapVex Pickup Update*\n\nDear *${name || 'Customer'}*,\nYour Scrap Pickup (ID: *${pickupId}*) status is now: *${formattedStatus}* 📦\n\n💰 *Total Amount*: ${amountStr}\n\nThank you for choosing ScrapVex - Sell Scrap Easily! ♻️`;
  const smsText = `ScrapVex Update: Pickup ID ${pickupId} status is now ${formattedStatus}. Amount: ${amountStr}. Thank you for choosing ScrapVex!`;

  console.log(`📲 [TRANSACTION NOTIFIER] Sending Status Update (${formattedStatus}) to +91 ${mobile}`);

  try {
    await sendWhatsAppOTP(mobile, waText);
  } catch (e) {
    console.error("WhatsApp transaction update error:", e.message);
  }

  try {
    await sendSMS(mobile, smsText);
  } catch (e) {
    console.error("SMS transaction update error:", e.message);
  }
};

module.exports = {
  sendWelcomeCredentialsNotification,
  sendPickupTransactionNotification
};
