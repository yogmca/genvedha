/**
 * Request Validation Middleware
 */

const EnvGenerator = require('../services/env-generator');
const envGenerator = new EnvGenerator();

function validateGenerationRequest(req, res, next) {
  const { userRequirements, credentials } = req.body;
  const errors = [];

  if (!userRequirements || typeof userRequirements !== 'string') {
    errors.push('userRequirements is required and must be a string');
  } else if (userRequirements.length < 10) {
    errors.push('userRequirements must be at least 10 characters long');
  } else if (userRequirements.length > 5000) {
    errors.push('userRequirements must not exceed 5000 characters');
  }

  if (!credentials || typeof credentials !== 'object') {
    errors.push('credentials object is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

function validateCredentials(credentials) {
  return envGenerator.validateCredentials(credentials);
}

module.exports = {
  validateGenerationRequest,
  validateCredentials
};
