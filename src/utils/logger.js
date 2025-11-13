/**
 * Logger utility for consistent logging across the application
 * In production, logs are suppressed unless explicitly enabled
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isLoggingEnabled = process.env.REACT_APP_ENABLE_LOGGING === 'true' || isDevelopment;

const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (...args) => {
    if (isLoggingEnabled) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log informational messages
   */
  info: (...args) => {
    if (isLoggingEnabled) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log warnings
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log errors (always logged)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

export default logger;

