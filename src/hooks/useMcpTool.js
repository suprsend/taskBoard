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
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/upsert`, {
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
      throw new Error(
        'Network error: Unable to connect to backend server. ' +
        'Please ensure the backend is running on ' + API_BASE_URL
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
