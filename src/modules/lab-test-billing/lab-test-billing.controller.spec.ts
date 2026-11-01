import { Test, TestingModule } from '@nestjs/testing';
import { LabTestBillingController } from './lab-test-billing.controller';
import { LabTestBillingService } from './lab-test-billing.service';

describe('LabTestBillingController', () => {
  let controller: LabTestBillingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LabTestBillingController],
      providers: [LabTestBillingService],
    }).compile();

    controller = module.get<LabTestBillingController>(LabTestBillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
