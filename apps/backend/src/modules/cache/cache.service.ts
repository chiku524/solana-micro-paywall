import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('REDIS_URL') !== undefined;
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Redis not configured, caching disabled');
      return;
    }

    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        // Parse URL to check if TLS is needed (rediss://)
        const isTLS = redisUrl.startsWith('rediss://');
        
        this.redis = new Redis(redisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            if (times > 3) {
              // Stop retrying after 3 attempts, disable Redis
              this.logger.warn('Redis connection failed after 3 attempts. Caching disabled.');
              this.redis = null;
              return null;
            }
            return delay;
          },
          enableReadyCheck: true,
          lazyConnect: true, // Don't connect immediately
          maxRetriesPerRequest: null, // Don't retry failed requests
          // TLS configuration for Upstash
          ...(isTLS && {
            tls: {
              rejectUnauthorized: true, // Verify SSL certificate
            },
          }),
        });

        this.redis.on('error', (err) => {
          // Only log errors if we're still trying to connect
          // Suppress connection refused errors after initial attempts
          if (err.message && !err.message.includes('ECONNREFUSED')) {
            this.logger.warn('Redis error (caching disabled):', err.message);
          }
          // Disable Redis on persistent errors
          if (this.redis) {
            this.redis.disconnect();
            this.redis = null;
          }
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });

        this.redis.on('ready', () => {
          this.logger.log('Redis ready to accept commands');
        });

        // Try to connect, but don't fail if it doesn't work
        this.redis.connect().catch(() => {
          this.logger.warn('Redis connection failed. Application will continue without caching.');
          this.redis = null;
        });
      }
    } catch (error) {
      this.logger.warn('Failed to initialize Redis. Caching disabled:', error instanceof Error ? error.message : String(error));
      this.redis = null;
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists check error for key ${key}`, error);
      return false;
    }
  }
}

