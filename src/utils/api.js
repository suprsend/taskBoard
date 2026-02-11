/**
 * Backend API client
 * Handles all API calls to the backend server
 * In production (Vercel), uses relative paths for same-domain API calls
 */

// Use relative path in production (Vercel), or explicit URL in development
// In production, use empty string for same-origin requests
// In development, use localhost backend
/**
 * Send OTP email via backend
 */
export const sendOTP = async (email, userName = 'User') => {
  try {
    // Construct URL directly at call time - check window.location inline
    let url = '/api/otp/send'; // Default to relative path (production)
    
    // Only use localhost if we're actually on localhost
    if (typeof window !== 'undefined' && window.location) {
      const hostname = String(window.location.hostname || '');
      const isLocalhost = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.startsWith('192.168.') || 
                         hostname.startsWith('10.') ||
                         hostname === '';
      
      if (isLocalhost) {
        url = 'http://localhost:3002/api/otp/send';
      }
      // Debug logging - ALWAYS log to help debug
      console.log('[sendOTP] Hostname:', hostname, 'isLocalhost:', isLocalhost, 'Final URL:', url);
    }
    
    console.log('[sendOTP] Making fetch request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userName }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to send OTP';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      const attemptedUrl = typeof window !== 'undefined' && window.location 
        ? `${window.location.origin}/api/otp/send` 
        : '/api/otp/send';
      throw new Error(`Network error: Unable to send OTP. Please check your internet connection and API configuration. (Attempted: ${attemptedUrl})`);
    }
    throw error;
  }
};

/**
 * Trigger workflow via backend
 */
export const triggerWorkflow = async (workflowSlug, userEmail, distinctId, userName, eventData) => {
  // Construct URL directly at call time - default to relative path (production)
  let url = '/api/workflow/trigger'; // Default to relative path (production)
  
  // Only use localhost if we're actually on localhost
  if (typeof window !== 'undefined' && window.location) {
    const hostname = String(window.location.hostname || '');
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') || 
                       hostname.startsWith('10.') ||
                       hostname === '';
    
    if (isLocalhost) {
      url = 'http://localhost:3002/api/workflow/trigger';
    }
    // Debug logging
    console.log('[triggerWorkflow] Hostname:', hostname, 'isLocalhost:', isLocalhost, 'Final URL:', url);
  }
  
  // Don't use REACT_APP_API_URL override on production domains
  if (process.env.REACT_APP_API_URL) {
    const isProductionDomain = typeof window !== 'undefined' && window.location && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('github.io'));
    
    if (!isProductionDomain) {
      url = `${process.env.REACT_APP_API_URL}/api/workflow/trigger`;
      console.log('[triggerWorkflow] Using REACT_APP_API_URL override:', url);
    } else {
      console.log('[triggerWorkflow] Ignoring REACT_APP_API_URL on production domain, using relative path:', url);
    }
  }
  
  console.log('[triggerWorkflow] Making fetch request to:', url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowSlug,
      userEmail,
      distinctId,
      userName,
      eventData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger workflow');
  }

  return response.json();
};

/**
 * Health check
 */
export const checkHealth = async () => {
  // Construct URL directly at call time - default to relative path (production)
  let url = '/api/health'; // Default to relative path (production)
  
  // Only use localhost if we're actually on localhost
  if (typeof window !== 'undefined' && window.location) {
    const hostname = String(window.location.hostname || '');
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') || 
                       hostname.startsWith('10.') ||
                       hostname === '';
    
    if (isLocalhost) {
      url = 'http://localhost:3002/api/health';
    }
  }
  
  // Don't use REACT_APP_API_URL override on production domains
  if (process.env.REACT_APP_API_URL) {
    const isProductionDomain = typeof window !== 'undefined' && window.location && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('github.io'));
    
    if (!isProductionDomain) {
      url = `${process.env.REACT_APP_API_URL}/api/health`;
    }
  }
  
  const response = await fetch(url);
  return response.json();
};

const apiClient = {
  sendOTP,
  triggerWorkflow,
  checkHealth,
};

export default apiClient;
