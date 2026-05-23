const axios = require('axios');

/**
 * Sends an SMS using Fast2SMS API.
 * @param {string} mobileNumber - The 10-digit mobile number.
 * @param {string} message - The message body.
 * @returns {Promise<object>} The response data from Fast2SMS.
 */
const sendSMS = async (mobileNumber, message) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.warn("FAST2SMS_API_KEY is not defined in environment variables. SMS not sent.");
      return { success: false, message: "API key missing" };
    }

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: apiKey,
        route: "v3",
        sender_id: "TXTIND", // Default sender ID for Fast2SMS
        message: message,
        language: "english",
        flash: 0,
        numbers: mobileNumber,
      },
    });

    console.log(`SMS successfully sent to ${mobileNumber}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, error.message);
    // Let it fail gracefully rather than crashing the server
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
};
