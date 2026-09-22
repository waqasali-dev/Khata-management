// Validation and sanitization helpers for Udhar Backend

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email.trim());
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function validateAmount(amount) {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

function validateTransactionType(type) {
  return ['udhar', 'payment'].includes(String(type).toLowerCase().trim());
}

module.exports = {
  validateEmail,
  sanitizeString,
  validateAmount,
  validateTransactionType,
};
