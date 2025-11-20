# Quick Wins: Immediate Improvements

These are high-impact, low-effort improvements you can implement right away.

## 🚀 1. Enable Response Compression (5 minutes)

**Impact**: 30-50% reduction in response size, faster API responses

**Implementation**:

```bash
cd apps/backend
npm install compression
npm install --save-dev @types/compression
```

```typescript
// apps/backend/src/main.ts
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.use(compression()); // Add this line
  app.use(helmet());
  // ... rest of code
}
```

---

## 🚀 2. Add Missing Database Indexes (10 minutes)

**Impact**: 10-100x query performance improvement

**Implementation**:

Add to `MIGRATION_SQL.sql`:

```sql
-- Critical indexes for payment verification
CREATE INDEX IF NOT EXISTS "idx_payment_intent_memo" ON "PaymentIntent"("memo");
CREATE INDEX IF NOT EXISTS "idx_payment_intent_status_expires" ON "PaymentIntent"("status", "expiresAt");

-- Payment lookup indexes
CREATE INDEX IF NOT EXISTS "idx_payment_tx_signature" ON "Payment"("txSignature");
CREATE INDEX IF NOT EXISTS "idx_payment_payer_wallet" ON "Payment"("payerWallet");

-- Access token expiration checks
CREATE INDEX IF NOT EXISTS "idx_access_token_expires" ON "AccessToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_access_token_merchant_expires" ON "AccessToken"("merchantId", "expiresAt");
```

Run in Supabase SQL Editor.

---

## 🚀 3. Fix QR Code Generation (15 minutes)

**Impact**: Enables mobile payments, critical feature

**Implementation**:

```bash
cd packages/widget-sdk
npm install qrcode
npm install --save-dev @types/qrcode
```

```typescript
// packages/widget-sdk/src/payment-widget.ts
import QRCode from 'qrcode';

async generateQR(paymentRequest: PaymentRequestResponse): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(paymentRequest.solanaPayUrl, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

---

## 🚀 4. Add Request Timeout Middleware (10 minutes)

**Impact**: Prevents hanging requests, better resource management

**Implementation**:

```typescript
// apps/backend/src/common/middleware/timeout.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set timeout to 30 seconds
    req.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  }
}
```

```typescript
// apps/backend/src/modules/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimeoutMiddleware).forRoutes('*');
  }
}
```

---

## 🚀 5. Improve Error Messages (20 minutes)

**Impact**: Better debugging, improved user experience

**Implementation**:

```typescript
// apps/backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## 🚀 6. Add Health Check Endpoint (10 minutes)

**Impact**: Better monitoring, deployment readiness

**Implementation**:

```typescript
// apps/backend/src/modules/health/health.controller.ts
// Already exists, but enhance it:

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private solana: SolanaService,
  ) {}

  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        solana: await this.checkSolana(),
      },
    };

    const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok');
    return {
      ...checks,
      status: allHealthy ? 'ok' : 'degraded',
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private async checkSolana() {
    try {
      const slot = await this.solana.getCurrentSlot();
      return { status: 'ok', slot };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
```

---

## 🚀 7. Add Request ID for Tracing (15 minutes)

**Impact**: Better debugging, request correlation

**Implementation**:

```typescript
// apps/backend/src/common/middleware/request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
```

```typescript
// Update logger to include request ID
// In your services, use:
this.logger.log({ requestId: req['requestId'], message: '...' });
```

---

## 🚀 8. Optimize Content List Query (20 minutes)

**Impact**: Faster marketplace/discovery pages

**Implementation**:

```typescript
// apps/backend/src/modules/contents/contents.service.ts
async findAll(query: ContentQueryDto) {
  const { page = 1, limit = 20, merchantId, search, category, visibility } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (merchantId) where.merchantId = merchantId;
  if (category) where.category = category;
  if (visibility) where.visibility = visibility;
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Use select to fetch only needed fields
  const [contents, total] = await Promise.all([
    this.prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        category: true,
        priceLamports: true,
        currency: true,
        visibility: true,
        viewCount: true,
        purchaseCount: true,
        createdAt: true,
        merchant: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
    this.prisma.content.count({ where }),
  ]);

  return {
    data: contents.map(c => ({
      ...c,
      priceLamports: c.priceLamports.toString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## 🚀 9. Add Payment Intent Expiration Cleanup (15 minutes)

**Impact**: Prevents database bloat, better data hygiene

**Implementation**:

```typescript
// apps/backend/src/modules/payments/payments.service.ts
// Add this method:

async cleanupExpiredIntents() {
  const result = await this.prisma.paymentIntent.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  });
  
  this.logger.log(`Marked ${result.count} expired payment intents`);
  return result.count;
}
```

```typescript
// apps/backend/src/main.ts
// Add cleanup on startup and schedule periodic cleanup
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupService {
  constructor(private paymentsService: PaymentsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredIntents() {
    await this.paymentsService.cleanupExpiredIntents();
  }
}
```

Don't forget to install:
```bash
npm install @nestjs/schedule
```

---

## 🚀 10. Add API Response Headers (5 minutes)

**Impact**: Better API documentation, security headers

**Implementation**:

```typescript
// apps/backend/src/main.ts
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

---

## 📊 Expected Impact Summary

| Improvement | Time | Impact | Priority |
|------------|------|--------|----------|
| Compression | 5 min | High | ⭐⭐⭐ |
| Database Indexes | 10 min | Very High | ⭐⭐⭐ |
| QR Code Fix | 15 min | High | ⭐⭐⭐ |
| Request Timeout | 10 min | Medium | ⭐⭐ |
| Error Messages | 20 min | Medium | ⭐⭐ |
| Health Check | 10 min | Medium | ⭐⭐ |
| Request ID | 15 min | Low | ⭐ |
| Query Optimization | 20 min | High | ⭐⭐⭐ |
| Cleanup Job | 15 min | Medium | ⭐⭐ |
| Response Headers | 5 min | Low | ⭐ |

**Total Time**: ~2 hours for all improvements
**Expected Performance Gain**: 30-50% improvement in response times and database queries

---

## 🎯 Recommended Order

1. **Database Indexes** (10 min) - Biggest impact
2. **Compression** (5 min) - Quick win
3. **QR Code Fix** (15 min) - Critical feature
4. **Query Optimization** (20 min) - High impact
5. **Cleanup Job** (15 min) - Prevents issues
6. **Error Messages** (20 min) - Better DX
7. **Health Check** (10 min) - Monitoring
8. **Request Timeout** (10 min) - Stability
9. **Request ID** (15 min) - Debugging
10. **Response Headers** (5 min) - Polish

---

*These quick wins can be implemented in a single afternoon and will provide immediate improvements to your micro-paywall platform.*

