/**
 * Vercel serverless function: Health check
 */

const { getCorsHeaders } = require('./utils');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', getCorsHeaders()['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers
  Object.entries(getCorsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
};
