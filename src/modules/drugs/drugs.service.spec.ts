import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStage } from 'mongoose';
import { DrugsService } from './drugs.service';

type DrugAggregateMock = (pipeline: PipelineStage[]) => {
  exec: () => Promise<unknown[]>;
};

describe('DurgsService', () => {
  let service: DrugsService;
  let aggregateMock: jest.MockedFunction<DrugAggregateMock>;

  beforeEach(async () => {
    aggregateMock = jest.fn<
      ReturnType<DrugAggregateMock>,
      Parameters<DrugAggregateMock>
    >();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrugsService,
        {
          provide: getModelToken('Drugs'),
          useValue: {
            aggregate: aggregateMock,
          },
        },
      ],
    }).compile();

    service = module.get<DrugsService>(DrugsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize hyphenated names when matching a query without dashes', async () => {
    aggregateMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

    await service.getDrugsByName('paracetamol');

    const pipeline = aggregateMock.mock.calls[0][0];
    const addFieldsStage = pipeline.find(
      (stage): stage is PipelineStage.AddFields => '$addFields' in stage,
    );
    const matchStage = pipeline.find(
      (stage): stage is PipelineStage.Match => '$match' in stage,
    );

    expect(addFieldsStage?.$addFields).toHaveProperty('nameNormalized');
    expect(addFieldsStage?.$addFields).toHaveProperty('contentNormalized');
    expect(addFieldsStage?.$addFields).toHaveProperty('companyNormalized');
    expect(matchStage?.$match.$or).toContainEqual({
      nameNormalized: { $regex: 'paracetamol', $options: 'i' },
    });
  });

  it.each(['Tab Paracetamol', 'tab. Paracetamol', 'Tablet Paracetamol'])(
    'should ignore a leading tablet label in the query: %s',
    async (query) => {
      aggregateMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      await service.getDrugsByName(query);

      const pipeline = aggregateMock.mock.calls[0][0];
      const matchStage = pipeline.find(
        (stage): stage is PipelineStage.Match => '$match' in stage,
      );

      expect(matchStage?.$match.$or).toContainEqual({
        nameNormalized: { $regex: 'paracetamol', $options: 'i' },
      });
    },
  );

  it('should not search when only a tablet label is provided', async () => {
    await expect(service.getDrugsByName('Tab ')).resolves.toEqual([]);

    expect(aggregateMock).not.toHaveBeenCalled();
  });
});
