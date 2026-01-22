/**
 * Vercel serverless function: Send OTP
 */

const { generateSecureOTP, validateEnv, getCorsHeaders } = require('../utils');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', getCorsHeaders()['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    validateEnv();

    const { email, userName = 'User' } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const otp = generateSecureOTP();
    const workflowSlug = process.env.OTP_WORKFLOW_SLUG || 'otp_verification';
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const workflowPayload = {
      workflow: workflowSlug,
      idempotency_key: idempotencyKey,
      recipients: [
        {
          distinct_id: email,
          $email: [email],
          name: userName,
          $channels: ['email'],
          $skip_create: false
        }
      ],
      data: {
        code: otp,
        otp: otp,
        user_name: userName
      }
    };

    const response = await fetch('https://hub.suprsend.com/trigger/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPRSEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      const errorData = responseText ? JSON.parse(responseText) : {};
      return res.status(response.status).json({
        error: errorData.message || errorData.error || `Failed to send OTP: ${response.status}`
      });
    }

    const result = responseText ? JSON.parse(responseText) : { success: true };
    
    // Set CORS headers
    Object.entries(getCorsHeaders()).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.json({
      success: true,
      messageId: result.message_id,
      // Only return OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};
