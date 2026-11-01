import { Test, TestingModule } from '@nestjs/testing';
import { ServicesBillingController } from './services-billing.controller';
import { ServicesBillingService } from './services-billing.service';

describe('ServicesBillingController', () => {
  let controller: ServicesBillingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesBillingController],
      providers: [ServicesBillingService],
    }).compile();

    controller = module.get<ServicesBillingController>(ServicesBillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
