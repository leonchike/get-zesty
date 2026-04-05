/**
 * Logger utility for the app
 * 
 * This provides a centralized way to handle logging throughout the app,
 * ensuring logs are only shown in development mode.
 * 
 * Usage:
 * import { logger } from '@/lib/utils/logger';
 * 
 * logger.log('Some message', data);
 * logger.error('Error occurred', error);
 * logger.warn('Warning', data);
 * logger.info('Information', data);
 * logger.debug('Debug info', data);
 */

// Determine if we're in development mode
const isDev = __DEV__;

/**
 * Logger utility for the app
 */
export const logger = {
  /**
   * Log a message (only in development)
   */
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log an error (only in development)
   */
  error: (...args: any[]): void => {
    if (isDev) {
      console.error(...args);
    }
  },

  /**
   * Log a warning (only in development)
   */
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log info (only in development)
   */
  info: (...args: any[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log debug info (only in development)
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

// Optional: add a production logger for critical errors
// that should be logged even in production
export const prodLogger = {
  /**
   * Log critical errors in production
   * Could be extended to send errors to a monitoring service
   */
  criticalError: (error: Error | unknown, context?: Record<string, any>): void => {
    // Always log critical errors
    console.error('[CRITICAL]', error, context);
    
    // Here you could add integration with error monitoring services
    // like Sentry, Bugsnag, etc.
  }
};