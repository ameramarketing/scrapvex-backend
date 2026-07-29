const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOtpResponsePayload } = require('../utils/sms');

test('buildOtpResponsePayload keeps the OTP flow usable when SMS delivery fails', () => {
  const result = buildOtpResponsePayload('4821', { success: false, error: 'Gateway rejected request' }, 'OTP sent via SMS');

  assert.equal(result.success, true);
  assert.equal(result.debugOtp, '4821');
  assert.equal(result.smsSent, false);
  assert.match(result.message, /SMS delivery failed/i);
});

test('buildOtpResponsePayload preserves the normal success path', () => {
  const result = buildOtpResponsePayload('4821', { success: true }, 'OTP sent via SMS');

  assert.equal(result.success, true);
  assert.equal(result.debugOtp, '4821');
  assert.equal(result.smsSent, true);
  assert.equal(result.message, 'OTP sent via SMS');
});
