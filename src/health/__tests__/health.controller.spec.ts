import { Test } from '@nestjs/testing';

import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns ok status without touching the database', () => {
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('bergizi-yuk-be');
  });

  it('returns an ISO 8601 timestamp', () => {
    const result = controller.check();

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});