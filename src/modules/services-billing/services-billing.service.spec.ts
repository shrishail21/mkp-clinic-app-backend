import { Test, TestingModule } from '@nestjs/testing';
import { ServicesBillingService } from './services-billing.service';

describe('ServicesBillingService', () => {
  let service: ServicesBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesBillingService],
    }).compile();

    service = module.get<ServicesBillingService>(ServicesBillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
