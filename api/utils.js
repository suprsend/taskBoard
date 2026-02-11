/**
 * Shared utilities for Vercel serverless functions
 */

/**
 * Generate cryptographically secure OTP
 */
function generateSecureOTP() {
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(3); // 3 bytes = 6 hex digits
  const otp = parseInt(randomBytes.toString('hex'), 16) % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Validate required environment variables
 */
function validateEnv() {
  const requiredEnvVars = ['SUPRSEND_API_KEY', 'SUPRSEND_WORKSPACE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * CORS headers for Vercel
 */
function getCorsHeaders() {
  // In Vercel, allow requests from the same origin (since API and frontend are on same domain)
  // Use wildcard for Vercel deployments to allow all origins
  // In production, Vercel handles CORS automatically for same-domain requests
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

module.exports = {
  generateSecureOTP,
  validateEnv,
  getCorsHeaders,
};
