import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

describe('PatientController', () => {
  let controller: PatientController;
  let service: PatientService;

  const mockPatientService = {
    createPatient: jest.fn().mockResolvedValue({ status: 201, message: 'Patient created successfully', data: { name: 'John Doe' }, error: null }),
    getPatient: jest.fn().mockResolvedValue({ status: 200, message: 'Patients retrieved successfully', data: [{ name: 'John Doe' }], error: null }),
    getSinglePatient: jest.fn().mockResolvedValue({ status: 200, message: 'Patient retrieved successfully', data: { id: 1, name: 'John Doe' }, error: null }),
    deletePatient: jest.fn().mockResolvedValue({ status: 200, message: 'Patient deleted successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        {
          provide: PatientService,
          useValue: mockPatientService,
        },
      ],
    }).compile();

    controller = module.get<PatientController>(PatientController);
    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a patient', async () => {
    const patientData = { name: 'John Doe' } as Parameters<PatientController['createPatient']>[0];
    const result = await controller.createPatient(patientData);
    expect(service.createPatient).toHaveBeenCalledWith(patientData);
    expect(result.status).toBe(201);
    expect(result.message).toBe('Patient created successfully');
  });

  it('should get patients by name', async () => {
    const search = { name: 'John' };
    const result = await controller.getPatients(search);
    expect(service.getPatient).toHaveBeenCalledWith(search);
    expect(result.status).toBe(200);
    expect(result.data).toEqual([{ name: 'John Doe' }]);
  });

  it('should get a single patient by id', async () => {
    const id = '507f191e810c19729de860ea';
    const result = await controller.getSinglePatient(id);
    expect(service.getSinglePatient).toHaveBeenCalledWith(id);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ id: 1, name: 'John Doe' });
  });

  it('should delete a patient by id', async () => {
    const id = '507f191e810c19729de860ea';
    const result = await controller.deletePatient(id);
    expect(service.deletePatient).toHaveBeenCalledWith(id);
    expect(result.status).toBe(200);
  });
});
