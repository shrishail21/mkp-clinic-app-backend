import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let patientModel: any;
  let prescriptionModel: any;
  let invoiceModel: any;

  beforeEach(async () => {
    patientModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    prescriptionModel = {
      updateMany: jest.fn(),
    };
    invoiceModel = {
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: getModelToken('Patient'), useValue: patientModel },
        { provide: getModelToken('Clinic'), useValue: {} },
        { provide: getModelToken('Prescription'), useValue: prescriptionModel },
        { provide: getModelToken('Invoice'), useValue: invoiceModel },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sets a three-day patient TTL and one-minute related-record TTLs', async () => {
    const patientId = '507f191e810c19729de860ea';
    const patient = { _id: new Types.ObjectId(patientId), delete_status: true };
    patientModel.findOne.mockResolvedValue({ _id: new Types.ObjectId(patientId) });
    patientModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(patient),
    });
    prescriptionModel.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    });
    invoiceModel.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    const result = await service.deletePatient(patientId);

    expect(prescriptionModel.updateMany).toHaveBeenCalledWith(
      { patient: expect.any(Types.ObjectId), delete_status: { $ne: true } },
      {
        $set: {
          delete_status: true,
          deletedAt: expect.any(Date),
          expiresAt: expect.any(Date),
        },
      },
    );
    const prescriptionsUpdate = prescriptionModel.updateMany.mock.calls[0][1].$set;
    const invoicesUpdate = invoiceModel.updateMany.mock.calls[0][1].$set;
    expect(invoiceModel.updateMany).toHaveBeenCalledWith(
      { patientId: expect.any(Types.ObjectId), delete_status: { $ne: true } },
      {
        $set: {
          delete_status: true,
          deletedAt: prescriptionsUpdate.deletedAt,
          expiresAt: prescriptionsUpdate.expiresAt,
        },
      },
    );
    expect(prescriptionsUpdate.expiresAt.getTime() - prescriptionsUpdate.deletedAt.getTime()).toBe(60_000);
    expect(invoicesUpdate.expiresAt.getTime() - invoicesUpdate.deletedAt.getTime()).toBe(60_000);
    expect(patientModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.any(Types.ObjectId), delete_status: { $ne: true } },
      {
        $set: {
          delete_status: true,
          deletedAt: prescriptionsUpdate.deletedAt,
          expiresAt: expect.any(Date),
        },
      },
      { new: true },
    );
    const patientUpdate = patientModel.findOneAndUpdate.mock.calls[0][1].$set;
    expect(patientUpdate.expiresAt.getTime() - patientUpdate.deletedAt.getTime())
      .toBe(3 * 24 * 60 * 60 * 1000);
    expect(result.status).toBe(200);
  });
});
