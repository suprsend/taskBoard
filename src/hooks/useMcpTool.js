import logger from '../utils/logger';

/**
 * Custom hook for managing MCP (Model Context Protocol) tool calls
 * Provides loading state, error handling, and SuprSend tool utilities
 * 
 * Note: Currently only provides placeholder state for components that expect it.
 * The actual MCP tool execution is handled by suprsendTools object.
 */
export const useMcpTool = () => {
  // Placeholder state for components that use this hook
  // In a full implementation, these would be managed by actual tool calls
  const loading = false;
  const error = null;

  return {
    loading,
    error
  };
};

/**
 * SuprSend tools object with common operations
 */
export const suprsendTools = {
  /**
   * Create or update user in SuprSend
   * @param {string} distinctId - User's distinct ID
   * @param {Object} userData - User data to create/update
   * @param {string} workspace - SuprSend workspace
   * @returns {Promise<Object>} User creation/update result
   */
  upsertUser: async (distinctId, userData, workspace = 'task-management-example-app') => {
    logger.debug(`Creating/updating user ${distinctId} in workspace ${workspace}`);
    logger.debug('User data:', userData);
    
    // Format user data according to SuprSend API specification
    const formattedUserData = {
      name: userData.name,
      $email: userData.$email // Should be array of email strings
    };
    
    logger.debug('Formatted user data for API:', formattedUserData);
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_SUPRSEND_API_KEY environment variable is required');
    }
    
    // Make actual HTTP call to SuprSend API
    try {
      const response = await fetch(`https://hub.suprsend.com/v1/user/${distinctId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedUserData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SuprSend API Error Response:', errorText);
        throw new Error(`SuprSend API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      logger.debug('SuprSend API: User created/updated successfully');
      return result;
    } catch (error) {
      logger.error('SuprSend API: Error creating user:', error);
      throw new Error(`Failed to create user in SuprSend: ${error.message}`);
    }
  },

  /**
   * Get user profile from SuprSend
   * @param {string} distinctId - User's distinct ID
   * @param {string} workspace - SuprSend workspace
   * @returns {Promise<Object>} User profile data
   */
  getUser: async (distinctId, workspace = 'task-management-example-app') => {
    logger.debug(`Getting user ${distinctId} from workspace ${workspace}`);
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_SUPRSEND_API_KEY environment variable is required');
    }
    
    // Make actual HTTP call to SuprSend API
    try {
      const response = await fetch(`https://hub.suprsend.com/v1/user/${distinctId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found in SuprSend');
        }
        const errorText = await response.text();
        throw new Error(`SuprSend API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      logger.debug('SuprSend API: User retrieved successfully');
      return result;
    } catch (error) {
      logger.error('SuprSend API: Error getting user:', error);
      throw new Error(`Failed to get user from SuprSend: ${error.message}`);
    }
  },

  /**
   * Identify user for session management
   * @param {string} distinctId - User's distinct ID
   * @returns {Promise<void>}
   */
  identifyUser: async (distinctId) => {
    logger.debug(`Identifying user: ${distinctId}`);
    
    // Check if SuprSend SDK is loaded
    if (typeof window !== 'undefined' && window.suprsend) {
      try {
        await window.suprsend.identify(distinctId);
        logger.debug('User identified successfully');
      } catch (err) {
        logger.error('Failed to identify user:', err);
        throw err;
      }
    } else {
      logger.warn('SuprSend SDK not loaded, skipping identify call');
      // Don't throw error, just log warning
    }
  },

  /**
   * Reset user session
   * @returns {Promise<void>}
   */
  resetUser: async () => {
    logger.debug('Resetting user session');
    
    if (typeof window !== 'undefined' && window.suprsend && window.suprsend.reset) {
      try {
        await window.suprsend.reset();
        logger.debug('User session reset successfully');
      } catch (err) {
        logger.error('Failed to reset user session:', err);
        throw err;
      }
    } else {
      logger.warn('SuprSend SDK not loaded, skipping reset call');
    }
  }
};

export default useMcpTool;