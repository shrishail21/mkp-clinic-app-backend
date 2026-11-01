import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStage, Types } from 'mongoose';
import { PrescriptionsService } from './prescriptions.service';

interface MockPrescription {
  _id: Types.ObjectId;
  delete_status?: boolean;
  expiresAt?: Date;
  deletedAt?: Date;
}

interface MockQuery<T> {
  exec: jest.Mock<Promise<T>, []>;
}

interface MockFindQuery extends MockQuery<unknown[]> {
  sort: jest.Mock<MockFindQuery, [Record<string, number>]>;
  skip: jest.Mock<MockFindQuery, [number]>;
  limit: jest.Mock<MockFindQuery, [number]>;
}

interface PrescriptionModelMock {
  find: jest.Mock<MockFindQuery, [Record<string, unknown>]>;
  countDocuments: jest.Mock<Promise<number>, [Record<string, unknown>]>;
  findOneAndUpdate: jest.Mock<
    MockQuery<MockPrescription | null>,
    [
      Record<string, unknown>,
      {
        $set: {
          delete_status: boolean;
          deletedAt: Date;
          expiresAt: Date;
        };
      },
      { new: boolean },
    ]
  >;
  aggregate: jest.Mock<MockQuery<unknown[]>, [PipelineStage[]]>;
  findOne: jest.Mock<
    Promise<{ _id: Types.ObjectId } | null>,
    [Record<string, unknown>]
  >;
}

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prescriptionModelMock: PrescriptionModelMock;
  let findQueryMock: MockFindQuery;

  beforeEach(async () => {
    findQueryMock = {
      sort: jest.fn<MockFindQuery, [Record<string, number>]>(),
      skip: jest.fn<MockFindQuery, [number]>(),
      limit: jest.fn<MockFindQuery, [number]>(),
      exec: jest.fn<Promise<unknown[]>, []>().mockResolvedValue([]),
    } as unknown as MockFindQuery;
    findQueryMock.sort.mockReturnValue(findQueryMock);
    findQueryMock.skip.mockReturnValue(findQueryMock);
    findQueryMock.limit.mockReturnValue(findQueryMock);

    const deletionQuery: MockQuery<MockPrescription | null> = {
      exec: jest
        .fn<Promise<MockPrescription | null>, []>()
        .mockResolvedValue(null),
    };
    const aggregateQuery: MockQuery<unknown[]> = {
      exec: jest.fn<Promise<unknown[]>, []>().mockResolvedValue([
        {
          data: [
            {
              company: 'Example Pharma',
              prescribedDrugCount: 12,
              prescriptionCount: 9,
            },
          ],
          metadata: [{ total: 1 }],
        },
      ]),
    };
    prescriptionModelMock = {
      find: jest
        .fn<MockFindQuery, [Record<string, unknown>]>()
        .mockReturnValue(findQueryMock),
      countDocuments: jest
        .fn<Promise<number>, [Record<string, unknown>]>()
        .mockResolvedValue(0),
      findOneAndUpdate: jest
        .fn<
          MockQuery<MockPrescription | null>,
          [
            Record<string, unknown>,
            {
              $set: {
                delete_status: boolean;
                deletedAt: Date;
                expiresAt: Date;
              };
            },
            { new: boolean },
          ]
        >()
        .mockReturnValue(deletionQuery),
      aggregate: jest
        .fn<MockQuery<unknown[]>, [PipelineStage[]]>()
        .mockReturnValue(aggregateQuery),
      findOne: jest
        .fn<
          Promise<{ _id: Types.ObjectId } | null>,
          [Record<string, unknown>]
        >()
        .mockResolvedValue({ _id: new Types.ObjectId() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: getModelToken('Prescription'),
          useValue: prescriptionModelMock,
        },
        {
          provide: getModelToken('Patient'),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken('User'),
          useValue: prescriptionModelMock,
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should paginate prescriptions by patient id', async () => {
    const patientId = '507f1f77bcf86cd799439011';

    await service.getPrescriptionsByPatientId(patientId, 2, 3);

    expect(prescriptionModelMock.find).toHaveBeenCalledWith({
      patient: new Types.ObjectId(patientId),
      delete_status: { $ne: true },
    });
    expect(findQueryMock.skip).toHaveBeenCalledWith(3);
    expect(findQueryMock.limit).toHaveBeenCalledWith(3);
    expect(prescriptionModelMock.countDocuments).toHaveBeenCalledWith({
      patient: new Types.ObjectId(patientId),
      delete_status: { $ne: true },
    });
  });

  it('soft deletes an active prescription', async () => {
    const deletedAt = new Date('2026-10-24T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(deletedAt);

    const prescriptionId = '507f191e810c19729de860ea';
    const prescription = {
      _id: new Types.ObjectId(prescriptionId),
      delete_status: true,
    };
    const query: MockQuery<MockPrescription | null> = {
      exec: jest
        .fn<Promise<MockPrescription | null>, []>()
        .mockResolvedValue(prescription),
    };
    prescriptionModelMock.findOneAndUpdate.mockReturnValue(query);

    const result = await service.deletePrescription(prescriptionId);

    expect(prescriptionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: prescriptionId, delete_status: { $ne: true } },
      {
        $set: {
          delete_status: true,
          deletedAt,
          expiresAt: new Date(deletedAt.getTime() + 60_000),
        },
      },
      { new: true },
    );
    expect(result.status).toBe(200);
  });

  it('returns company totals with pagination', async () => {
    const clinicId = '507f1f77bcf86cd799439012';
    const result = await service.getCompanyPrescriptionAnalytics(
      2,
      5,
      undefined,
      undefined,
      undefined,
      clinicId,
    );

    expect(result).toEqual({
      status: 200,
      message: 'Prescription company analytics retrieved successfully',
      data: [
        {
          company: 'Example Pharma',
          prescribedDrugCount: 12,
          prescriptionCount: 9,
        },
      ],
      error: null,
      pagination: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });

    const pipeline = getPipeline(prescriptionModelMock);
    expect(pipeline[0]).toHaveProperty('$match.delete_status', { $ne: true });
    expect(pipeline[1]).toHaveProperty('$lookup.from', 'patients');
    expect(pipeline[3]).toHaveProperty(
      '$match',
      expect.objectContaining({
        'patientData.clinicId': new Types.ObjectId(clinicId),
      }),
    );
    expect(pipeline[pipeline.length - 1]).toHaveProperty('$facet.data', [
      { $skip: 5 },
      { $limit: 5 },
    ]);
  });

  it('filters results by doctor and caps the page size at 100', async () => {
    const doctorId = '507f1f77bcf86cd799439011';

    const clinicId = '507f1f77bcf86cd799439012';
    await service.getCompanyPrescriptionAnalytics(
      1,
      500,
      doctorId,
      undefined,
      undefined,
      clinicId,
    );

    const pipeline = getPipeline(prescriptionModelMock);
    expect(pipeline[0]).toHaveProperty(
      '$match.prescribedBy',
      new Types.ObjectId(doctorId),
    );
    expect(prescriptionModelMock.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(doctorId),
      clinicId: new Types.ObjectId(clinicId),
      role: 'Doctor',
      delete_status: { $ne: true },
    });
    expect(pipeline[pipeline.length - 1]).toHaveProperty('$facet.data', [
      { $skip: 0 },
      { $limit: 100 },
    ]);
  });

  it('filters prescriptions by the selected UTC month and year', async () => {
    await service.getCompanyPrescriptionAnalytics(
      1,
      10,
      undefined,
      10,
      2026,
      '507f1f77bcf86cd799439012',
    );

    const pipeline = getPipeline(prescriptionModelMock);
    expect(pipeline[0]).toHaveProperty('$match.createdAt', {
      $gte: new Date(Date.UTC(2026, 9, 1)),
      $lt: new Date(Date.UTC(2026, 10, 1)),
    });
  });

  it('requires a year when a month is provided', async () => {
    await expect(
      service.getCompanyPrescriptionAnalytics(
        1,
        10,
        undefined,
        10,
        undefined,
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toThrow('Year is required when filtering by month');
    expect(prescriptionModelMock.aggregate).not.toHaveBeenCalled();
  });

  it('rejects a doctor outside the admin clinic', async () => {
    prescriptionModelMock.findOne.mockResolvedValue(null);

    await expect(
      service.getCompanyPrescriptionAnalytics(
        1,
        10,
        '507f1f77bcf86cd799439011',
        undefined,
        undefined,
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toThrow('Doctor does not belong to the admin clinic');
    expect(prescriptionModelMock.aggregate).not.toHaveBeenCalled();
  });
});

function getPipeline(modelMock: PrescriptionModelMock): PipelineStage[] {
  const pipeline = modelMock.aggregate.mock.calls[0]?.[0];
  if (!pipeline) {
    throw new Error('Expected prescription aggregation pipeline');
  }
  return pipeline;
}
