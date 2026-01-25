/**
 * Backend API client
 * Handles all API calls to the backend server
 * In production (Vercel), uses relative paths for same-domain API calls
 */

// Use relative path in production (Vercel), or explicit URL in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002');

/**
 * Send OTP email via backend
 */
export const sendOTP = async (email, userName = 'User') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userName }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to send OTP');
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      throw new Error(`Network error: Backend server is not reachable at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
    throw error;
  }
};

/**
 * Trigger workflow via backend
 */
export const triggerWorkflow = async (workflowSlug, userEmail, distinctId, userName, eventData) => {
  const response = await fetch(`${API_BASE_URL}/api/workflow/trigger`, {
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
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
};

const apiClient = {
  sendOTP,
  triggerWorkflow,
  checkHealth,
};

export default apiClient;
