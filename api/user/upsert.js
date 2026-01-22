/**
 * Vercel serverless function: Upsert user
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
      // Set CORS headers
      Object.entries(getCorsHeaders()).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      return res.json({ success: true, message: 'User created successfully' });
    }
    
    try {
      const result = JSON.parse(responseText);
      // Set CORS headers
      Object.entries(getCorsHeaders()).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      res.json(result);
    } catch (parseError) {
      // If response is not valid JSON, return success
      Object.entries(getCorsHeaders()).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      res.json({ success: true, message: responseText || 'User created successfully' });
    }

  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Failed to create user. Please try again.' });
  }
};
