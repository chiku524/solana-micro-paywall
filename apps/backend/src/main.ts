import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

import { AppModule } from './modules/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Suppress punycode deprecation warning (from dependencies like @solana/web3.js)
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: any, ...args: any[]) {
  if (typeof warning === 'string' && warning.includes('punycode')) {
    return; // Suppress punycode warnings
  }
  if (typeof warning === 'object' && warning?.name === 'DeprecationWarning' && warning?.message?.includes('punycode')) {
    return; // Suppress punycode deprecation warnings
  }
  return originalEmitWarning.call(process, warning, ...args);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use NestJS default logger
  // Logger is available globally in NestJS
  
  // Enable response compression
  app.use(compression());
  
  app.use(helmet());
  app.setGlobalPrefix('api');
  
  // Add security and API headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
  
  // Add global exception filter for better error handling
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable CORS for widget SDK
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  app.enableCors({
    origin: isDevelopment && corsOrigins.length === 0 
      ? '*' // Allow all in development if not specified
      : corsOrigins.length > 0 
        ? corsOrigins 
        : false, // Deny all in production if not specified
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.API_PORT || process.env.PORT || 3000;
  const host = process.env.API_HOST || '0.0.0.0';
  await app.listen(port, host);
  Logger.log(`Backend API listening on ${host}:${port}`, 'Bootstrap');
}

void bootstrap();

