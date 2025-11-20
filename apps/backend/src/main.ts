import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
  
  // Swagger API Documentation (only if package is installed)
  try {
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
      const config = new DocumentBuilder()
        .setTitle('Solana Micro-Paywall API')
        .setDescription('API documentation for Solana Micro-Paywall platform')
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addTag('merchants', 'Merchant management endpoints')
        .addTag('contents', 'Content management endpoints')
        .addTag('payments', 'Payment processing endpoints')
        .addTag('discover', 'Marketplace discovery endpoints')
        .addTag('auth', 'Authentication endpoints')
        .addTag('health', 'Health check endpoints')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
      
      Logger.log('Swagger documentation available at /api/docs', 'Bootstrap');
    }
  } catch (error) {
    Logger.warn('Swagger not available - package may not be installed', 'Bootstrap');
  }
  
  // Enable global JWT guard (can be overridden with @Public() decorator)
  // app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  
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

