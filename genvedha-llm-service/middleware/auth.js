/**
 * Authentication Middleware
 */

const { config } = require('../config');

function authenticate(req, res, next) {
  if (!config.security.enableAuth) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'API key is missing'
    });
  }

  if (apiKey !== config.security.apiKey) {
    return res.status(403).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid API key'
    });
  }

  next();
}

module.exports = { authenticate };
