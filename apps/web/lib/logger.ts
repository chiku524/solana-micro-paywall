/**
 * Client-side logging utility
 * Replaces console.log/error with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, error?: Error, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
      metadata,
    };

    // In development, log to console with formatting
    if (process.env.NODE_ENV === 'development') {
      const prefix = this.context ? `[${this.context}]` : '';
      const logMessage = `${prefix} ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, metadata || '');
          break;
        case 'info':
          console.info(logMessage, metadata || '');
          break;
        case 'warn':
          console.warn(logMessage, metadata || '');
          break;
        case 'error':
          console.error(logMessage, error || metadata || '');
          break;
      }
    }

    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Only send errors and warnings to tracking service
      if (level === 'error' || level === 'warn') {
        // This will be integrated with Sentry later
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          if (level === 'error' && error) {
            (window as any).Sentry.captureException(error, {
              contexts: {
                custom: {
                  message,
                  context: this.context,
                  metadata,
                },
              },
            });
          } else {
            (window as any).Sentry.captureMessage(message, {
              level: level === 'error' ? 'error' : 'warning',
              contexts: {
                custom: {
                  context: this.context,
                  metadata,
                },
              },
            });
          }
        }
      }
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, undefined, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, undefined, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, undefined, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('error', message, error, metadata);
  }
}

// Create default logger
export const logger = new Logger();

// Create logger factory
export function createLogger(context: string): Logger {
  return new Logger(context);
}

