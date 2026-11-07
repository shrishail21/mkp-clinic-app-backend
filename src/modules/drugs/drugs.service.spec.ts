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
  let updateManyMock: jest.Mock;

  beforeEach(async () => {
    aggregateMock = jest.fn<
      ReturnType<DrugAggregateMock>,
      Parameters<DrugAggregateMock>
    >();
    updateManyMock = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrugsService,
        {
          provide: getModelToken('Drugs'),
          useValue: {
            aggregate: aggregateMock,
            updateMany: updateManyMock,
            collection: { name: 'drugs' },
          },
        },
      ],
    }).compile();

    service = module.get<DrugsService>(DrugsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should bound indexed prefix candidates before scoring them', async () => {
    aggregateMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

    await service.getDrugsByName('paracetamol');

    const pipeline = aggregateMock.mock.calls[0][0];
    const matchFields = [
      (pipeline[0] as PipelineStage.Match).$match,
      ...pipeline
        .filter(
          (stage): stage is PipelineStage.UnionWith => '$unionWith' in stage,
        )
        .map((stage) => stage.$unionWith)
        .filter(
          (union): union is Exclude<typeof union, string> =>
            typeof union !== 'string',
        )
        .map((union) => union.pipeline?.[0])
        .filter(
          (stage): stage is PipelineStage.Match => !!stage && '$match' in stage,
        )
        .map((stage) => stage.$match),
    ];

    expect(matchFields).toEqual([
      { nameNormalized: { $regex: '^paracetamol' } },
      { contentNormalized: { $regex: '^paracetamol' } },
      { companyNormalized: { $regex: '^paracetamol' } },
    ]);
    expect(pipeline[1]).toEqual({ $limit: 100 });
    expect(pipeline[2]).toMatchObject({
      $unionWith: {
        coll: 'drugs',
        pipeline: [
          { $match: { contentNormalized: { $regex: '^paracetamol' } } },
          { $limit: 100 },
        ],
      },
    });
    expect(pipeline[3]).toMatchObject({
      $unionWith: {
        coll: 'drugs',
        pipeline: [
          { $match: { companyNormalized: { $regex: '^paracetamol' } } },
          { $limit: 100 },
        ],
      },
    });
  });

  it.each(['Tab Paracetamol', 'tab. Paracetamol', 'Tablet Paracetamol'])(
    'should ignore a leading tablet label in the query: %s',
    async (query) => {
      aggregateMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      await service.getDrugsByName(query);

      const pipeline = aggregateMock.mock.calls[0][0];
      expect((pipeline[0] as PipelineStage.Match).$match).toEqual({
        nameNormalized: { $regex: '^paracetamol' },
      });
    },
  );

  it('should escape regex characters in a prefix query', async () => {
    aggregateMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

    await service.getDrugsByName('C++');

    const matchStage = aggregateMock.mock.calls[0][0][0] as PipelineStage.Match;
    expect(matchStage.$match).toEqual({
      nameNormalized: { $regex: '^c\\+\\+' },
    });
  });

  it('should backfill normalized fields for existing records at startup', async () => {
    await service.onModuleInit();

    expect(updateManyMock).toHaveBeenCalledWith(
      {
        $or: [
          { nameNormalized: { $exists: false } },
          { contentNormalized: { $exists: false } },
          { companyNormalized: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            nameNormalized: expect.objectContaining({
              $replaceAll: expect.any(Object),
            }),
            contentNormalized: expect.objectContaining({
              $replaceAll: expect.any(Object),
            }),
            companyNormalized: expect.objectContaining({
              $replaceAll: expect.any(Object),
            }),
          },
        },
      ],
    );
  });

  it('should not search when only a tablet label is provided', async () => {
    await expect(service.getDrugsByName('Tab ')).resolves.toEqual([]);

    expect(aggregateMock).not.toHaveBeenCalled();
  });
});
