import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  root() {
    return { status: 'ok', service: 'spider-api' };
  }

  @Get('/health')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
