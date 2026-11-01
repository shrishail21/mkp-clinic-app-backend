import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): object {
    return {
      message: 'Welcome to the Patient Registration API',
      status: 200,
    };
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      message: 'HealSync backend is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
