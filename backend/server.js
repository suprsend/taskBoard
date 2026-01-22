/**
 * Simple Express backend for TaskBoard
 * Handles API key operations and OTP generation securely
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Security: Validate required environment variables
const requiredEnvVars = ['SUPRSEND_API_KEY', 'SUPRSEND_WORKSPACE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please create a .env file in the backend directory with:');
  console.error('SUPRSEND_API_KEY=your-api-key');
  console.error('SUPRSEND_WORKSPACE=your-workspace');
  process.exit(1);
}

/**
 * Generate cryptographically secure OTP
 */
function generateSecureOTP() {
  // Use crypto for secure random number generation
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(3); // 3 bytes = 6 hex digits
  const otp = parseInt(randomBytes.toString('hex'), 16) % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Send OTP via SuprSend workflow
 */
app.post('/api/otp/send', async (req, res) => {
  try {
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
    
    res.json({
      success: true,
      messageId: result.message_id,
      // Only return OTP in development mode for testing
      // In production, OTP is only sent via email for security
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

/**
 * Upsert user in SuprSend
 */
app.post('/api/user/upsert', async (req, res) => {
  try {
    const { distinctId, userData, workspace } = req.body;

    if (!distinctId || !userData) {
      return res.status(400).json({ error: 'distinctId and userData are required' });
    }

    const objectPayload = {};
    
    if (userData.name) {
      objectPayload.name = userData.name;
    }
    
    if (userData.$email && userData.$email.length > 0) {
      objectPayload.$email = userData.$email;
    }
    
    if (!objectPayload.$email || objectPayload.$email.length === 0) {
      return res.status(400).json({ error: 'Email is required to create user' });
    }

    const apiUrl = `https://hub.suprsend.com/v1/user/${encodeURIComponent(distinctId)}/`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPRSEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(objectPayload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `SuprSend API error: ${response.status}`;
      try {
        if (responseText && responseText.trim()) {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        }
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      return res.status(response.status).json({ error: errorMessage });
    }
    
    // Handle response - SuprSend may return empty response on success
    if (!responseText || responseText.trim() === '') {
      return res.json({ success: true, message: 'User created successfully' });
    }
    
    try {
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (parseError) {
      // If response is not valid JSON, return success
      res.json({ success: true, message: responseText || 'User created successfully' });
    }

  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Failed to create user. Please try again.' });
  }
});

/**
 * Trigger workflow (for task events)
 */
app.post('/api/workflow/trigger', async (req, res) => {
  try {
    const { workflowSlug, userEmail, distinctId, userName, eventData } = req.body;

    if (!workflowSlug || !userEmail || !distinctId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const workflowPayload = {
      workflow: workflowSlug,
      idempotency_key: idempotencyKey,
      recipients: [
        {
          distinct_id: distinctId,
          $email: [userEmail],
          name: userName || 'User',
          $channels: ['email', 'inbox'],
          $skip_create: false
        }
      ],
      data: eventData || {}
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
        error: errorData.message || errorData.error || `Workflow trigger failed: ${response.status}`
      });
    }

    const result = responseText ? JSON.parse(responseText) : { success: true };
    res.json({ success: true, messageId: result.message_id });

  } catch (error) {
    console.error('Error triggering workflow:', error);
    res.status(500).json({ error: 'Failed to trigger workflow. Please try again.' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ TaskBoard backend server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Key configured: ${process.env.SUPRSEND_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
