const crypto = require('crypto');

module.exports = function createTrackingCode() {
  return `SN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};
