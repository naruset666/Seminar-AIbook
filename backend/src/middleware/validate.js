const { validationResult } = require('express-validator');

// Run after express-validator chains; responds 400 with the first error message.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
}

module.exports = { validate };
