import { Test, TestingModule } from '@nestjs/testing';
import { DrugsController } from './drugs.controller';
import { DrugsService } from './drugs.service';

describe('DrugsController', () => {
  let controller: DrugsController;
  const drugsService = {
    createDrug: jest.fn(),
    getDrugsByName: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrugsController],
      providers: [{ provide: DrugsService, useValue: drugsService }],
    }).compile();

    controller = module.get<DrugsController>(DrugsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a drug through the service', async () => {
    const drugData = {
      name: 'Paracetamol',
      content: '500 mg',
      company: 'Example Pharma',
    };
    const createdDrug = { _id: 'drug-id', ...drugData };
    drugsService.createDrug.mockResolvedValue(createdDrug);

    await expect(controller.createDrug(drugData)).resolves.toEqual({
      message: 'Drug created successfully',
      status: 201,
      data: createdDrug,
    });
    expect(drugsService.createDrug).toHaveBeenCalledWith(drugData);
  });
});
