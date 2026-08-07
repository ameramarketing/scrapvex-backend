const { sendWhatsAppOTP } = require('./whatsapp');
const { sendSMS } = require('./sms');

/**
 * 1. Account Creation Credentials Notification
 */
const sendWelcomeCredentialsNotification = async ({ name, mobile, role = "user", password }) => {
  const roleTitle = role.toUpperCase();
  const loginUrl = "https://scrapvex.netlify.app";

  const waText = `🟢 *Welcome to ScrapVex!*\n\nDear *${name || 'User'}*, your *${roleTitle}* account has been created successfully! 🎉\n\n📱 *Mobile / Username*: ${mobile}\n🔑 *Password*: ${password}\n\n🌐 *Login Now*: ${loginUrl}\n\nKeep your credentials safe!`;
  const smsText = `ScrapVex: Welcome ${name || 'User'}! Your ${roleTitle} account is created. Mobile: ${mobile}, Password: ${password}. Login: ${loginUrl}`;

  console.log(`📲 [NOTIFIER] Sending Login Credentials to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 2. New Pickup Booking Confirmation (Customer)
 */
const sendPickupBookingNotification = async ({ mobile, name, pickupId, date, timeSlot, scrapType, estimatedAmount }) => {
  const waText = `📦 *ScrapVex Pickup Request Received!*\n\nDear *${name || 'Customer'}*,\nYour pickup request has been booked successfully! 🎉\n\n🆔 *Pickup ID*: #${pickupId}\n🗓️ *Scheduled Date*: ${date || 'Today'}\n⏰ *Time Slot*: ${timeSlot || 'As per convenience'}\n♻️ *Items*: ${scrapType || 'Scrap Material'}\n💰 *Est. Value*: ₹${estimatedAmount || '0'}\n\nOur team is assigning a nearby collector. Thank you for choosing ScrapVex!`;
  const smsText = `ScrapVex: Pickup #${pickupId} booked successfully for ${date || 'Today'}. Items: ${scrapType || 'Scrap'}. Est Value: RS ${estimatedAmount || '0'}. Thank you!`;

  console.log(`📲 [NOTIFIER] Sending Booking Confirmation (#${pickupId}) to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 3. Collector Assigned Alert (Customer)
 */
const sendCollectorAssignedCustomerNotification = async ({ customerMobile, customerName, collectorName, collectorPhone, pickupId }) => {
  const waText = `🚚 *Collector Assigned for Pickup #${pickupId}*\n\nDear *${customerName || 'Customer'}*,\nOur Verified Collector *${collectorName}* has been assigned to pick up your scrap!\n\n📞 *Collector Contact*: +91 ${collectorPhone}\n\nHe will contact you before arriving. Please keep your scrap ready!`;
  const smsText = `ScrapVex: Collector ${collectorName} (Ph: ${collectorPhone}) has been assigned for your pickup #${pickupId}. He will reach you soon.`;

  console.log(`📲 [NOTIFIER] Sending Collector Assigned Alert to Customer +91 ${customerMobile}`);
  try { await sendWhatsAppOTP(customerMobile, waText); } catch (e) {}
  try { await sendSMS(customerMobile, smsText); } catch (e) {}
};

/**
 * 4. New Duty / Task Alert (Collector)
 */
const sendNewTaskCollectorNotification = async ({ collectorMobile, collectorName, customerName, customerPhone, address, city, scrapType, pickupId }) => {
  const waText = `🚨 *NEW PICKUP TASK ASSIGNED! (#${pickupId})*\n\nHello *${collectorName}*,\nYou have been assigned a new pickup duty!\n\n👤 *Customer*: ${customerName} (+91 ${customerPhone})\n📍 *Address*: ${address}, ${city}\n📦 *Scrap Type*: ${scrapType}\n\nPlease contact the customer and start your journey!`;
  const smsText = `ScrapVex Collector Alert: New Duty #${pickupId} at ${address}, ${city}. Customer: ${customerName} (Ph: ${customerPhone}). Check app for details!`;

  console.log(`📲 [NOTIFIER] Sending New Task Alert to Collector +91 ${collectorMobile}`);
  try { await sendWhatsAppOTP(collectorMobile, waText); } catch (e) {}
  try { await sendSMS(collectorMobile, smsText); } catch (e) {}
};

/**
 * 5. Collector Out For Pickup / Reaching Soon (Customer)
 */
const sendCollectorOnTheWayNotification = async ({ customerMobile, customerName, collectorName, pickupId }) => {
  const waText = `🛵 *Collector Is On The Way!*\n\nDear *${customerName || 'Customer'}*,\nCollector *${collectorName}* is currently on the way to your location for Pickup #${pickupId}!\n\nPlease keep your scrap items accessible.`;
  const smsText = `ScrapVex: Collector ${collectorName} is on the way to your address for Pickup #${pickupId}. Please keep scrap ready!`;

  console.log(`📲 [NOTIFIER] Sending On-The-Way Alert to Customer +91 ${customerMobile}`);
  try { await sendWhatsAppOTP(customerMobile, waText); } catch (e) {}
  try { await sendSMS(customerMobile, smsText); } catch (e) {}
};

/**
 * 6. Pickup Completed & Digital Bill Receipt (Customer)
 */
const sendPickupCompletedReceiptNotification = async ({ customerMobile, customerName, pickupId, totalWeight, totalAmount, paymentMode = "Cash/UPI" }) => {
  const waText = `✨ *ScrapVex Pickup Completed & Digital Receipt*\n\nDear *${customerName || 'Customer'}*,\nThank you for selling scrap with ScrapVex! ♻️\n\n🆔 *Receipt ID*: #${pickupId}\n⚖️ *Total Weight*: ${totalWeight || 'N/A'} kg\n💰 *Amount Paid*: ₹${totalAmount}\n💳 *Payment Mode*: ${paymentMode}\n\nYou saved the environment today! Keep selling scrap with ScrapVex. 🌿`;
  const smsText = `ScrapVex Bill #${pickupId}: Pickup completed. Total Weight: ${totalWeight || 'N/A'}kg. Amount Paid: RS ${totalAmount} via ${paymentMode}. Thank you!`;

  console.log(`📲 [NOTIFIER] Sending Digital Receipt (#${pickupId}) to Customer +91 ${customerMobile}`);
  try { await sendWhatsAppOTP(customerMobile, waText); } catch (e) {}
  try { await sendSMS(customerMobile, smsText); } catch (e) {}
};

/**
 * 7. Wallet Money Credited (Customer / Collector)
 */
const sendWalletCreditNotification = async ({ mobile, name, amount, pickupId, newBalance }) => {
  const waText = `💳 *ScrapVex Wallet Credited!*\n\nDear *${name || 'User'}*,\n₹${amount} has been credited to your ScrapVex Wallet for Pickup #${pickupId || 'Transaction'}! 💵\n\n👛 *New Wallet Balance*: ₹${newBalance || amount}\n\nYou can use your balance or withdraw to UPI anytime from the app!`;
  const smsText = `ScrapVex: RS ${amount} credited to your wallet for Pickup #${pickupId || 'Txn'}. New Balance: RS ${newBalance || amount}. Check app wallet!`;

  console.log(`📲 [NOTIFIER] Sending Wallet Credit Notification to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 8. Bank / UPI Withdrawal Status Alert (Collector / Franchise / Customer)
 */
const sendWithdrawalStatusNotification = async ({ mobile, name, amount, upiId, status = "APPROVED" }) => {
  const isApproved = status.toUpperCase() === "APPROVED" || status.toUpperCase() === "COMPLETED";
  const statusEmoji = isApproved ? "✅" : "❌";

  const waText = `${statusEmoji} *Withdrawal Request ${status.toUpperCase()}*\n\nDear *${name || 'User'}*,\nYour wallet withdrawal request of *₹${amount}* to UPI (*${upiId || 'Bank'}*) has been *${status.toUpperCase()}*.\n\n${isApproved ? 'Funds have been transferred to your bank account.' : 'Please check your bank details and try again.'}`;
  const smsText = `ScrapVex: Withdrawal of RS ${amount} to ${upiId || 'UPI'} is ${status.toUpperCase()}. ${isApproved ? 'Amount transferred.' : 'Contact support.'}`;

  console.log(`📲 [NOTIFIER] Sending Withdrawal (${status}) Alert to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 9. Password Reset Security Confirmation
 */
const sendPasswordResetSecurityNotification = async ({ mobile, name }) => {
  const waText = `🔐 *Security Alert: Password Updated*\n\nDear *${name || 'User'}*,\nYour ScrapVex account password was successfully changed just now.\n\nIf you did not make this change, please contact support immediately!`;
  const smsText = `ScrapVex Security: Your account password was changed successfully. If not done by you, contact ScrapVex support immediately!`;

  console.log(`📲 [NOTIFIER] Sending Password Security Alert to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 10. Daily Evening Business Summary Report (Franchise Owner)
 */
const sendDailyFranchiseSummaryNotification = async ({ franchiseMobile, franchiseName, city, totalPickups, totalWeight, totalPayout }) => {
  const waText = `📊 *ScrapVex Daily Business Summary - ${city || 'City'}*\n\nHello *${franchiseName || 'Franchise Partner'}*,\nHere is your daily performance summary for today:\n\n📦 *Pickups Completed*: ${totalPickups}\n⚖️ *Total Scrap Collected*: ${totalWeight} kg\n💰 *Total Daily Payout*: ₹${totalPayout}\n\nGreat work today! Keep growing ScrapVex in ${city}! 🚀`;
  const smsText = `ScrapVex Daily Summary (${city}): Pickups Completed: ${totalPickups}, Scrap Collected: ${totalWeight}kg, Payout: RS ${totalPayout}. Good job today!`;

  console.log(`📲 [NOTIFIER] Sending Daily Business Report to Franchise +91 ${franchiseMobile}`);
  try { await sendWhatsAppOTP(franchiseMobile, waText); } catch (e) {}
  try { await sendSMS(franchiseMobile, smsText); } catch (e) {}
};

/**
 * 11. New Pickup Alert to Admin's WhatsApp & SMS
 */
const sendAdminNewPickupNotification = async ({ adminMobile, name, mobile, address, city, scrapType, pickupId, estimatedAmount }) => {
  if (!adminMobile) return;
  const waText = `🚨 *NEW PICKUP BOOKING RECEIVED! (#${pickupId})*\n\nHello Admin,\nA new customer has booked a doorstep pickup!\n\n👤 *Customer Name*: ${name}\n📞 *Mobile*: +91 ${mobile}\n📍 *City & Address*: ${address}, ${city}\n📦 *Material*: ${scrapType}\n💰 *Est. Amount*: ₹${estimatedAmount || 0}\n\nPlease check Admin Dashboard to assign a collector!`;
  const smsText = `ScrapVex Admin Alert: New Pickup #${pickupId} booked by ${name} (Ph: ${mobile}) in ${city}. Check dashboard!`;

  console.log(`📲 [NOTIFIER] Sending Admin New Pickup Alert to +91 ${adminMobile}`);
  try { await sendWhatsAppOTP(adminMobile, waText); } catch (e) {}
  try { await sendSMS(adminMobile, smsText); } catch (e) {}
};

/**
 * 6b. Admin Status Update / Purchase Record Notification
 */
const sendPickupTransactionNotification = async ({ mobile, name, pickupId, status, amount, weight, scrapType }) => {
  const isCompleted = status === "Completed";
  const emoji = isCompleted ? "✨" : "📋";
  
  const waText = `${emoji} *ScrapVex Purchase & Order Update*\n\nDear *${name || 'Customer'}*,\nYour ScrapVex order #${pickupId} status has been updated to: *${status.toUpperCase()}* ${isCompleted ? '🎉' : ''}\n\n${isCompleted ? `📦 *Scrap Type*: ${scrapType || 'Scrap Material'}\n⚖️ *Weight*: ${weight || 'N/A'} kg\n💰 *Amount Paid / Credited*: ₹${amount || 0}\n\nThank you for choosing ScrapVex Recycling! ♻️` : `We will update you on further progress.`}`;
  const smsText = `ScrapVex Order #${pickupId} update: Status is ${status}. ${isCompleted ? `Amount Paid: RS ${amount || 0}. Thank you!` : ''}`;

  console.log(`📲 [NOTIFIER] Sending Pickup Status/Purchase Notification (#${pickupId}) to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

module.exports = {
  sendWelcomeCredentialsNotification,
  sendPickupBookingNotification,
  sendCollectorAssignedCustomerNotification,
  sendNewTaskCollectorNotification,
  sendCollectorOnTheWayNotification,
  sendPickupCompletedReceiptNotification,
  sendPickupTransactionNotification,
  sendWalletCreditNotification,
  sendWithdrawalStatusNotification,
  sendPasswordResetSecurityNotification,
  sendDailyFranchiseSummaryNotification,
  sendAdminNewPickupNotification
};
