const crypto = require('crypto');

function createPrefixedId(prefix) {
  return `${String(prefix || 'id').trim()}_${crypto.randomBytes(8).toString('hex')}`;
}

function createWidgetKey() {
  return `wk_${crypto.randomBytes(24).toString('hex')}`;
}

module.exports = {
  createPrefixedId,
  createWidgetKey
};
