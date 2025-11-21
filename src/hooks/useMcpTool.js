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
  
  const backendProxyUrl = process.env.REACT_APP_MCP_PROXY_URL;
  
  if (backendProxyUrl) {
    try {
      const mcpResponse = await fetch(`${backendProxyUrl}/suprsend/upsert-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distinct_id: distinctId,
          workspace: workspace,
          action: 'upsert',
          object_payload: objectPayload
        })
      });
      
      if (mcpResponse.ok) {
        return await mcpResponse.json();
      }
    } catch (proxyError) {
      // Fall through to direct API call
    }
  }
  
  try {
    const apiUrl = `https://hub.suprsend.com/v1/user/${encodeURIComponent(distinctId)}/`;
    
    const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_SUPRSEND_API_KEY is not configured');
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(objectPayload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `SuprSend API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (parseError) {
      return { success: true, message: responseText || 'User created successfully' };
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('Load failed') ||
        error.message.includes('NetworkError') ||
        error.name === 'TypeError') {
      throw new Error(
        'Network error: Unable to reach SuprSend API. ' +
        'This may be a CORS issue. To use MCP tools, set up a backend proxy ' +
        'and configure REACT_APP_MCP_PROXY_URL environment variable.'
      );
    }
    
    throw new Error(`Failed to create user in SuprSend: ${error.message}`);
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
      console.error('Failed to reset user session:', err);
    }
  }
};

export const suprsendTools = {
  upsertUser,
  identifyUser,
  resetUser
};

export default suprsendTools;
