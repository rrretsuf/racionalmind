import * as Sentry from '@sentry/react-native';

const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export const logger = {
  debug: (message: string, extra?: Record<string, any>) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, extra || '');
    }
    // Always add breadcrumb regardless of environment
    Sentry.addBreadcrumb({
      category: 'debug',
      message,
      level: 'debug',
      data: extra || {},
    });
  },

  info: (message: string, extra?: Record<string, any>) => {
    if (!isProduction) {
      console.info(`[INFO] ${message}`, extra || '');
    }
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      level: 'info',
      data: extra || {},
    });
  },

  warn: (message: string, extra?: Record<string, any>) => {
    if (!isProduction) {
      console.warn(`[WARN] ${message}`, extra || '');
    }
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: extra || {},
    });
  },

  error: (message: string, error?: any, extra: Record<string, any> = {}) => {
    const errorContext = { ...extra, message };

    if (!isProduction) {
      console.error(`[ERROR] ${message}`, { error, ...extra });
    }

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: errorContext,
        level: 'error',
      });
    } else {
      // Try to create a synthetic error for better grouping
      try {
        throw new Error(message);
      } catch (syntheticError: any) {
        Sentry.captureException(syntheticError, {
          extra: { ...errorContext, originalError: error },
          level: 'error',
        });
      }
    }
  },
}; 