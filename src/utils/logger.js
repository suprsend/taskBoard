/**
 * Production-safe logging utility
 * Only logs in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log error messages, not full objects
      const sanitized = args.map(arg => {
        if (typeof arg === 'object') {
          // Remove sensitive data
          const { apiKey, password, token, ...safe } = arg;
          return safe;
        }
        return arg;
      });
      console.error(...sanitized);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger;
