export const upsertUser = async (distinctId, userData, workspace = 'task-management-example-app') => {
  const objectPayload = {};
  
  if (userData.name) {
    objectPayload.name = userData.name;
  }
  
  if (userData.$email && userData.$email.length > 0) {
    objectPayload.$email = userData.$email;
  }
  
  if (!objectPayload.$email || objectPayload.$email.length === 0) {
    throw new Error('Email is required to create user');
  }
  
  // Use backend API (secure)
  // Construct URL directly at call time - default to relative path (production)
  // IMPORTANT: Default to relative path, only use localhost if explicitly on localhost
  let url = '/api/user/upsert'; // Default to relative path (production)
  
  // Only use localhost if we're actually on localhost
  // Check window.location.hostname at runtime
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = String(window.location.hostname);
    // Explicitly check for localhost - if NOT localhost, keep relative path
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') || 
                       hostname.startsWith('10.') ||
                       hostname === '';
    
    if (isLocalhost) {
      url = 'http://localhost:3002/api/user/upsert';
    }
    // If not localhost (e.g., vercel.app), url stays as '/api/user/upsert'
    
    // Debug logging - ALWAYS log to help debug
    console.log('[useMcpTool] Hostname:', hostname, 'isLocalhost:', isLocalhost, 'Final URL:', url);
  }
  
  // Check for explicit API URL override (only in development, NOT in production)
  // Don't use REACT_APP_API_URL if we're on a production domain (vercel.app, etc.)
  if (process.env.REACT_APP_API_URL) {
    const isProductionDomain = typeof window !== 'undefined' && window.location && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('github.io'));
    
    // Only use REACT_APP_API_URL if we're NOT on a production domain
    if (!isProductionDomain) {
      url = `${process.env.REACT_APP_API_URL}/api/user/upsert`;
      console.log('[useMcpTool] Using REACT_APP_API_URL override:', url);
    } else {
      console.log('[useMcpTool] Ignoring REACT_APP_API_URL on production domain, using:', url);
    }
  }
  
  try {
    console.log('[useMcpTool] Making fetch request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        distinctId,
        userData: objectPayload,
        workspace
      })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = 'Failed to create user';
      try {
        const error = responseText ? JSON.parse(responseText) : {};
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Parse response, handle empty responses
    if (!responseText || responseText.trim() === '') {
      return { success: true, message: 'User created successfully' };
    }
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // If response is not JSON, return success with the text
      return { success: true, message: responseText || 'User created successfully' };
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError')) {
      const attemptedUrl = typeof window !== 'undefined' && window.location 
        ? `${window.location.origin}/api/user/upsert` 
        : '/api/user/upsert';
      throw new Error(
        'Network error: Unable to connect to backend server. ' +
        `(Attempted: ${attemptedUrl})`
      );
    }
    
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

export const identifyUser = async (distinctId) => {
  if (typeof window !== 'undefined' && window.suprsend) {
    try {
      await window.suprsend.identify(distinctId);
    } catch (err) {
      // Silent fail
    }
  }
};

export const resetUser = async () => {
  if (typeof window !== 'undefined' && window.suprsend?.reset) {
    try {
      await window.suprsend.reset();
    } catch (err) {
      // Silent fail - reset is not critical
    }
  }
};

export const suprsendTools = {
  upsertUser,
  identifyUser,
  resetUser
};

export default suprsendTools;
