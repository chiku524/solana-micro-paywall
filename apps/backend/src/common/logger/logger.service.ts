import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: NestLoggerService;
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    this.logger = new (class implements NestLoggerService {
      log(message: any, context?: string) {
        console.log(`[${context || 'App'}]`, message);
      }
      error(message: any, trace?: string, context?: string) {
        console.error(`[${context || 'App'}]`, message, trace || '');
      }
      warn(message: any, context?: string) {
        console.warn(`[${context || 'App'}]`, message);
      }
      debug(message: any, context?: string) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[${context || 'App'}]`, message);
        }
      }
      verbose(message: any, context?: string) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${context || 'App'}] [VERBOSE]`, message);
        }
      }
    })();
  }

  log(message: any, context?: string) {
    this.logger.log(message, context);
    // In production, send to logging service
    if (!this.isDevelopment) {
      // TODO: Send to logging service (e.g., Winston, Pino, CloudWatch)
    }
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
    // In production, send to error tracking service
    if (!this.isDevelopment) {
      // TODO: Send to error tracking service (Sentry, etc.)
    }
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string) {
    if (this.logger.debug) {
      this.logger.debug(message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (this.logger.verbose) {
      this.logger.verbose(message, context);
    }
  }
}

