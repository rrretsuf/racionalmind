import { Sentry } from "./sentry.ts";

const environment = Deno.env.get("APP_ENV") || "development";
const isProduction = environment === "production";

export const logger = {
  debug: (message: string, extra?: any) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, extra || "");
    }
    Sentry.addBreadcrumb({
      category: 'debug',
      message,
      level: 'debug',
      data: extra || {}
    });
  },
  
  info: (message: string, extra?: any) => {
    if (!isProduction) {
      console.info(`[INFO] ${message}`, extra || "");
    }
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      level: 'info',
      data: extra || {}
    });
  },
  
  warn: (message: string, extra?: any) => {
    if (!isProduction) {
      console.warn(`[WARN] ${message}`, extra || "");
    }
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: extra || {}
    });
  },
  
  error: (message: string, error?: any, extra: Record<string, any> = {}) => {
    const errorContext = { ...extra, message };
    
    if (!isProduction) {
      console.error(`[ERROR] ${message}`, { 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        ...extra 
      });
    }
    
    if (isProduction) { // Only send to Sentry in production
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: errorContext,
          level: 'error',
        });
      } else {
        // Try to create a synthetic error for better grouping in Sentry
        try {
          throw new Error(message);
        } catch (syntheticError: any) { 
          Sentry.captureException(syntheticError, {
            extra: { ...errorContext, originalError: error }, 
            level: 'error',
          });
        }
      }
    }
  }
}; 