/**
 * Shared utility functions used across the application
 */

/**
 * Validates if a string is a valid email address
 * @param {string} str - String to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
export const isEmailAddress = (str) => {
  if (!str || typeof str !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str.trim());
};

/**
 * Extracts a display name from an email address
 * @param {string} assignee - Email address or name
 * @returns {string} - Formatted name
 */
export const extractNameFromEmail = (assignee) => {
  if (isEmailAddress(assignee)) {
    const emailPart = assignee.split('@')[0];
    return emailPart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }
  return assignee;
};

/**
 * Extracts user information from user object
 * @param {Object} user - User object
 * @returns {Object} - Object with userEmail and userName
 */
export const getUserInfo = (user) => {
  const userEmail = user?.profile?.$email?.[0]?.value || 
                   user?.profile?.properties?.email || 
                   user?.distinctId || 
                   'user@example.com';
  const userName = user?.profile?.properties?.name || 'User';
  
  return { userEmail, userName };
};

/**
 * Cleans markdown formatting from text
 * @param {string} text - Text with potential markdown
 * @returns {string} - Cleaned text
 */
export const cleanMarkdown = (text) => {
  if (!text) return '';
  return String(text).replace(/\*\*(.*?)\*\*/g, '$1');
};

