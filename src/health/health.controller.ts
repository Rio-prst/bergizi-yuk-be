import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Liveness probe aplikasi. Tidak mengakses database dan tidak memerlukan autentikasi.',
  })
  @ApiOkResponse({
    description: 'Aplikasi berjalan.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'bergizi-yuk-be' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'bergizi-yuk-be',
      timestamp: new Date().toISOString(),
    };
  }
}