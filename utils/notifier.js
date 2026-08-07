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

/**
 * 12. Purchase / Handoff Recorded Alert to Collector
 */
const sendCollectorPurchaseReceiptNotification = async ({ collectorMobile, collectorName, invoiceNo, items, totalAmount, paymentStatus, autoSettleAmount }) => {
  if (!collectorMobile) return;

  const itemSummary = items && items.length > 0
    ? items.map(i => `• ${i.name || 'Scrap'}: ${i.quantity} kg @ ₹${i.rate}/kg = ₹${i.amount}`).join("\n")
    : `Total Amount: ₹${totalAmount}`;

  const waText = `🧾 *ScrapVex Purchase & Settlement Receipt*\n\nHello *${collectorName || 'Collector/Partner'}*,\nYour scrap handoff / purchase has been recorded by Admin! 📦\n\n🆔 *Ref*: #${invoiceNo}\n\n📋 *Items Purchased*:\n${itemSummary}\n\n💰 *Total Amount*: ₹${totalAmount}\n💳 *Payment Status*: ${paymentStatus || 'COMPLETED'}${autoSettleAmount > 0 ? `\n⚖️ *Debt Settled*: ₹${autoSettleAmount}` : ''}\n\nThank you for working with ScrapVex! ♻️`;
  
  const smsText = `ScrapVex Purchase Receipt #${invoiceNo}: Amount RS ${totalAmount}. Items: ${items?.length || 1} scrap categories. Status: ${paymentStatus}. Thank you!`;

  console.log(`📲 [NOTIFIER] Sending Collector Purchase Receipt to +91 ${collectorMobile}`);
  try { await sendWhatsAppOTP(collectorMobile, waText); } catch (e) {}
  try { await sendSMS(collectorMobile, smsText); } catch (e) {}
};

/**
 * 13. New Wallet Deposit Alert to Admin
 */
const sendAdminNewDepositNotification = async ({ adminMobile = "9086038222", name, mobile, role, amount, upiRefNo }) => {
  if (!adminMobile) return;
  const waText = `🟢 *NEW WALLET DEPOSIT REQUEST RECEIVED!*\n\nHello Admin,\nA user has submitted a wallet deposit payment:\n\n👤 *Name*: ${name || 'Partner'}\n📱 *Mobile*: +91 ${mobile}\n🏷️ *Role*: ${(role || 'User').toUpperCase()}\n💰 *Amount*: ₹${amount}\n🔗 *12-Digit UTR / Ref No*: *${upiRefNo}*\n\nPlease check Admin Dashboard to verify UTR and Approve/Reject!`;
  const smsText = `ScrapVex Admin Alert: New Deposit Request of RS ${amount} by ${name} (Ph: ${mobile}, UTR: ${upiRefNo}). Check dashboard to approve!`;

  console.log(`📲 [NOTIFIER] Sending Admin New Deposit Alert to +91 ${adminMobile}`);
  try { await sendWhatsAppOTP(adminMobile, waText); } catch (e) {}
  try { await sendSMS(adminMobile, smsText); } catch (e) {}
};

/**
 * 14. Deposit Approved Notification (Customer / Franchise / Collector)
 */
const sendDepositApprovedNotification = async ({ mobile, name, amount, upiRefNo, newBalance }) => {
  const waText = `🎉 *WALLET DEPOSIT APPROVED!*\n\nDear *${name || 'User'}*,\nYour deposit of *₹${amount}* (UTR: *${upiRefNo}*) has been verified & approved! 💵\n\n👛 *Updated Wallet Balance*: *₹${newBalance}*\n\nThank you for choosing ScrapVex! ♻️`;
  const smsText = `ScrapVex: Deposit of RS ${amount} (UTR: ${upiRefNo}) APPROVED. Updated Wallet Balance: RS ${newBalance}. Thank you!`;

  console.log(`📲 [NOTIFIER] Sending Deposit Approved Alert to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 15. Deposit Rejected Notification with Reason (Customer / Franchise / Collector)
 */
const sendDepositRejectedNotification = async ({ mobile, name, amount, upiRefNo, reason }) => {
  const waText = `❌ *WALLET DEPOSIT REJECTED*\n\nDear *${name || 'User'}*,\nYour wallet deposit request of *₹${amount}* (UTR: *${upiRefNo}*) could not be approved.\n\n⚠️ *Reason*: ${reason || 'Payment or UTR could not be verified'}.\n\nIf you have paid, please contact ScrapVex support with your payment screenshot.`;
  const smsText = `ScrapVex: Deposit of RS ${amount} (UTR: ${upiRefNo}) REJECTED. Reason: ${reason || 'Unverified UTR'}. Contact support for help.`;

  console.log(`📲 [NOTIFIER] Sending Deposit Rejected Alert to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 16. Withdrawal Approved Notification (User / Collector)
 */
const sendWithdrawalApprovedNotification = async ({ mobile, name, amount, upiId, newBalance }) => {
  const waText = `✅ *WITHDRAWAL REQUEST APPROVED*\n\nDear *${name || 'User'}*,\nYour withdrawal request of *₹${amount}* to UPI (*${upiId || 'Bank'}*) has been processed successfully! 🏦\n\n👛 *Remaining Wallet Balance*: *₹${newBalance}*\n\nFunds have been transferred to your account.`;
  const smsText = `ScrapVex: Withdrawal of RS ${amount} to ${upiId || 'UPI'} APPROVED. Remaining Balance: RS ${newBalance}. Amount transferred!`;

  console.log(`📲 [NOTIFIER] Sending Withdrawal Approved Alert to +91 ${mobile}`);
  try { await sendWhatsAppOTP(mobile, waText); } catch (e) {}
  try { await sendSMS(mobile, smsText); } catch (e) {}
};

/**
 * 17. Withdrawal Rejected Notification with Reason (User / Collector)
 */
const sendWithdrawalRejectedNotification = async ({ mobile, name, amount, upiId, reason, newBalance }) => {
  const waText = `❌ *WITHDRAWAL REQUEST REJECTED*\n\nDear *${name || 'User'}*,\nYour withdrawal request of *₹${amount}* to UPI (*${upiId || 'Bank'}*) could not be processed.\n\n⚠️ *Reason*: ${reason || 'Incorrect bank/UPI details'}.\n\n💰 *Refund*: ₹${amount} has been refunded back to your wallet.\n👛 *Current Wallet Balance*: *₹${newBalance}*`;
  const smsText = `ScrapVex: Withdrawal of RS ${amount} REJECTED. Reason: ${reason || 'Invalid bank info'}. RS ${amount} refunded to wallet. Balance: RS ${newBalance}.`;

  console.log(`📲 [NOTIFIER] Sending Withdrawal Rejected Alert to +91 ${mobile}`);
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
  sendAdminNewPickupNotification,
  sendCollectorPurchaseReceiptNotification,
  sendAdminNewDepositNotification,
  sendDepositApprovedNotification,
  sendDepositRejectedNotification,
  sendWithdrawalApprovedNotification,
  sendWithdrawalRejectedNotification
};
