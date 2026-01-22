/**
 * Security utilities and warnings
 */

/**
 * Check if API key is being used in client-side code
 * This is a security risk and should be moved to backend
 */
export const checkApiKeySecurity = () => {
  if (process.env.REACT_APP_SUPRSEND_API_KEY && process.env.NODE_ENV === 'production') {
    console.error(
      '%c⚠️ SECURITY WARNING ⚠️',
      'color: red; font-size: 16px; font-weight: bold;'
    );
    console.error(
      'REACT_APP_SUPRSEND_API_KEY is exposed in client-side code!\n' +
      'This is a CRITICAL security vulnerability.\n' +
      'API keys should NEVER be used in frontend code.\n' +
      'Please move all API key operations to a backend server.'
    );
    
    // In production, we should throw an error or disable functionality
    // For now, we'll just warn
    if (process.env.REACT_APP_STRICT_SECURITY === 'true') {
      throw new Error(
        'Security violation: API key detected in client code. ' +
        'This application cannot run in production with exposed API keys.'
      );
    }
  }
};

/**
 * Validate environment variables for production
 */
export const validateProductionConfig = () => {
  const warnings = [];
  
  if (process.env.NODE_ENV === 'production') {
    // Check for API key in client-side code (should not exist)
    if (process.env.REACT_APP_SUPRSEND_API_KEY) {
      warnings.push(
        'REACT_APP_SUPRSEND_API_KEY should not be used in client-side code. ' +
        'All API operations should go through the backend server.'
      );
    }
    
    // Check that backend API URL is configured
    if (!process.env.REACT_APP_API_URL) {
      warnings.push(
        'REACT_APP_API_URL is not configured. ' +
        'Frontend needs backend API URL to function properly.'
      );
    }
  }
  
  if (warnings.length > 0) {
    console.warn('Production Configuration Warnings:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
  }
  
  return warnings;
};

const securityUtils = {
  checkApiKeySecurity,
  validateProductionConfig
};

export default securityUtils;
