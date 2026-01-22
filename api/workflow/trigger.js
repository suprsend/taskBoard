/**
 * Vercel serverless function: Trigger workflow
 */

const { validateEnv, getCorsHeaders } = require('../utils');

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
    
    // Set CORS headers
    Object.entries(getCorsHeaders()).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.json({ success: true, messageId: result.message_id });

  } catch (error) {
    console.error('Error triggering workflow:', error);
    res.status(500).json({ error: 'Failed to trigger workflow. Please try again.' });
  }
};
