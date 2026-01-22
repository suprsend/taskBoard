/**
 * Input sanitization utilities
 * Prevents XSS attacks and validates input
 */

// Maximum lengths for inputs
export const MAX_LENGTHS = {
  TITLE: 200,
  DESCRIPTION: 2000,
  NAME: 100,
  EMAIL: 255
};

/**
 * Sanitize HTML to prevent XSS
 * Basic implementation - consider using DOMPurify for production
 */
export const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitize text input (removes HTML tags)
 */
export const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  
  // Remove HTML tags
  const stripped = str.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = stripped;
  return div.textContent || div.innerText || '';
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
};

/**
 * Validate and sanitize task title
 */
export const sanitizeTitle = (title) => {
  if (typeof title !== 'string') return '';
  
  const sanitized = sanitizeText(title).trim();
  
  if (sanitized.length === 0) {
    return '';
  }
  
  if (sanitized.length > MAX_LENGTHS.TITLE) {
    return sanitized.substring(0, MAX_LENGTHS.TITLE);
  }
  
  return sanitized;
};

/**
 * Validate and sanitize task description
 */
export const sanitizeDescription = (description) => {
  if (typeof description !== 'string') return '';
  
  const sanitized = sanitizeText(description).trim();
  
  if (sanitized.length > MAX_LENGTHS.DESCRIPTION) {
    return sanitized.substring(0, MAX_LENGTHS.DESCRIPTION);
  }
  
  return sanitized;
};

/**
 * Validate and sanitize user name
 */
export const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  
  const sanitized = sanitizeText(name).trim();
  
  if (sanitized.length > MAX_LENGTHS.NAME) {
    return sanitized.substring(0, MAX_LENGTHS.NAME);
  }
  
  return sanitized;
};

/**
 * Validate OTP (6 digits)
 */
export const sanitizeOTP = (otp) => {
  if (typeof otp !== 'string') return '';
  
  // Only allow digits
  const digits = otp.replace(/\D/g, '');
  
  // Limit to 6 digits
  return digits.substring(0, 6);
};

const sanitizeUtils = {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeName,
  sanitizeOTP,
  MAX_LENGTHS
};

export default sanitizeUtils;
