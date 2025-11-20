import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: await this.healthService.checkDatabase(),
        solana: await this.healthService.checkSolana(),
      },
    };

    const allHealthy = Object.values(checks.checks).every((c: any) => c.status === 'ok');
    return {
      ...checks,
      status: allHealthy ? 'ok' : 'degraded',
    };
  }
}

