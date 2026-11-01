import { Test, TestingModule } from '@nestjs/testing';
import { LabTestBillingService } from './lab-test-billing.service';

describe('LabTestBillingService', () => {
  let service: LabTestBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LabTestBillingService],
    }).compile();

    service = module.get<LabTestBillingService>(LabTestBillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
