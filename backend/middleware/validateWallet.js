const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Middleware factory that validates a wallet address field in req.body.
 * @param {string} fieldName - The body field to validate.
 */
export function validateWalletField(fieldName) {
  return (req, res, next) => {
    const value = req.body[fieldName];
    if (!value || !WALLET_REGEX.test(value)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    next();
  };
}
