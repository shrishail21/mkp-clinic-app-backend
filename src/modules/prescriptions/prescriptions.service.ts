import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { PrescriptionDto } from 'src/dto/prescription.dto';
import { UpdatePrescriptionDto } from 'src/dto/update-prescription.dto';
import { Patient } from 'src/schema/patient.schema';
import { Prescription } from 'src/schema/prescriptions.schema';
import { Role, User } from '../../schema/user.schema';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel('Prescription') private prescriptionModel: Model<Prescription>,
    @InjectModel('Patient') private patientsModel: Model<Patient>,
    @InjectModel('User') private usersModel: Model<User>,
  ) {}

  async createPrescription(
    id,
    PrescriptionData: PrescriptionDto,
    prescribedBy: string,
  ) {
    try {
      const patient = await this.patientsModel.findOne({
        _id: id,
        delete_status: { $ne: true },
      });
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
      const prescription = {
        ...PrescriptionData,
        patient: patient._id,
        patientName: patient.name,
        prescribedBy: new Types.ObjectId(prescribedBy),
      };
      const data = await this.prescriptionModel.create(prescription);
      const sendData = {
        ...prescription,
        createdAt: new Date(),
        patientData: patient ? patient.toObject() : null,
      };
      if (!data) {
        return {
          status: 400,
          message: 'Prescription Failed to create',
          error: 'Failed to create prescription',
        };
      }
      return {
        status: 201,
        message: 'Prescription created successfully',
        data: sendData,
        error: null,
      };
    } catch {
      throw new NotFoundException(
        'Patient not found or prescription creation failed',
      );
    }
  }

  async getCompanyPrescriptionAnalytics(
    page: number,
    limit: number,
    doctorId?: string,
    month?: number,
    year?: number,
    clinicId?: string,
  ) {
    if (!clinicId || !Types.ObjectId.isValid(clinicId)) {
      throw new BadRequestException('A valid admin clinic is required');
    }
    const clinicObjectId = new Types.ObjectId(clinicId);
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const match: Record<string, unknown> = {
      delete_status: { $ne: true },
    };
    if (doctorId) {
      if (!Types.ObjectId.isValid(doctorId)) {
        throw new BadRequestException('Invalid doctor ID');
      }
      const doctor = await this.usersModel.findOne({
        _id: new Types.ObjectId(doctorId),
        clinicId: clinicObjectId,
        role: Role.DOCTOR,
        delete_status: { $ne: true },
      });
      if (!doctor) {
        throw new BadRequestException(
          'Doctor does not belong to the admin clinic',
        );
      }
      match.prescribedBy = new Types.ObjectId(doctorId);
    }
    if (month !== undefined && year === undefined) {
      throw new BadRequestException('Year is required when filtering by month');
    }
    if (year !== undefined) {
      const start = month
        ? new Date(Date.UTC(year, month - 1, 1))
        : new Date(Date.UTC(year, 0, 1));
      const end = month
        ? new Date(Date.UTC(year, month, 1))
        : new Date(Date.UTC(year + 1, 0, 1));
      match.createdAt = { $gte: start, $lt: end };
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      { $unwind: '$patientData' },
      {
        $match: {
          'patientData.clinicId': clinicObjectId,
          'patientData.delete_status': { $ne: true },
        },
      },
      { $unwind: '$drug' },
      {
        $match: {
          'drug.company': { $type: 'string', $ne: '' },
          $expr: {
            $ne: [{ $trim: { input: '$drug.company' } }, ''],
          },
        },
      },
      {
        $group: {
          _id: {
            company: {
              $toLower: { $trim: { input: '$drug.company' } },
            },
            prescription: '$_id',
          },
          company: { $first: { $trim: { input: '$drug.company' } } },
          prescribedDrugCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.company',
          company: { $first: '$company' },
          prescribedDrugCount: { $sum: '$prescribedDrugCount' },
          prescriptionCount: { $sum: 1 },
        },
      },
      { $sort: { prescribedDrugCount: -1, company: 1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: safeLimit }],
          metadata: [{ $count: 'total' }],
        },
      },
    ];

    const [result] = await this.prescriptionModel
      .aggregate<{
        data: Array<{
          company: string;
          prescribedDrugCount: number;
          prescriptionCount: number;
        }>;
        metadata: Array<{ total: number }>;
      }>(pipeline)
      .exec();
    const total = result?.metadata[0]?.total ?? 0;

    return {
      status: 200,
      message: 'Prescription company analytics retrieved successfully',
      data: result?.data ?? [],
      error: null,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getPrescriptionsByPatientId(
    id: string,
    page: number = 1,
    limit: number = 3,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(3, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const filter = {
      patient: new Types.ObjectId(id),
      delete_status: { $ne: true },
    };

    const [data, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    if (data.length === 0) {
      return {
        status: 404,
        message: 'No prescriptions found for this patient',
        data: [],
        error: null,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      };
    }

    return {
      status: 200,
      message: 'Prescriptions retrieved successfully',
      data,
      error: null,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getPrescriptionsByIdWithPatientData(id: string) {
    type PrescriptionWithPatientData = {
      _id: Types.ObjectId;
      patientData: {
        name: string;
        gender: string;
        birthday: Date;
      } | null;
      [key: string]: unknown;
    };

    const [data] =
      await this.prescriptionModel.aggregate<PrescriptionWithPatientData>([
        {
          $match: {
            _id: new Types.ObjectId(id),
            delete_status: { $ne: true },
          },
        },
        {
          $lookup: {
            from: 'patients',
            localField: 'patient',
            foreignField: '_id',
            as: 'patientData',
          },
        },
        {
          $project: {
            _id: 1,
            drug: 1,
            Diagnosis: 1,
            patient: 1,
            patientName: 1,
            delete_status: 1,
            deletedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            weight: 1,
            bloodPressure: 1,
            pulseRate: 1,
            bloodSugarLevel: 1,
            patientData: {
              $ifNull: [
                {
                  $let: {
                    vars: {
                      patient: { $arrayElemAt: ['$patientData', 0] },
                    },
                    in: {
                      name: '$$patient.name',
                      gender: '$$patient.gender',
                      birthday: '$$patient.birthday',
                    },
                  },
                },
                null,
              ],
            },
          },
        },
      ]);

    if (!data) {
      return {
        status: 404,
        message: 'Prescription not found',
        data: null,
        error: 'Not Found',
      };
    }

    return {
      status: 200,
      message: 'Prescription retrieved successfully',
      data: {
        ...data,
        patientData: data.patientData ?? null,
      },
      error: null,
    };
  }

  async getPrescriptionsById(id: string) {
    const data = await this.prescriptionModel.findOne({
      _id: id,
      delete_status: { $ne: true },
    });
    if (!data) {
      return {
        status: 404,
        message: 'Prescription not found',
        data: null,
        error: 'Not Found',
      };
    }
    return {
      status: 200,
      message: 'Prescription retrieved successfully',
      data: data,
      error: null,
    };
  }

  async updatePrescription(id: string, updateData: UpdatePrescriptionDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid prescription ID');
    }
    const data = await this.prescriptionModel
      .findOneAndUpdate({ _id: id, delete_status: { $ne: true } }, updateData, {
        new: true,
      })
      .exec();
    if (!data) {
      return {
        status: 404,
        message: 'Prescription not found',
        data: null,
        error: 'Not Found',
      };
    }
    return {
      status: 200,
      message: 'Prescription updated successfully',
      data: data,
      error: null,
    };
  }

  async deletePrescription(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid prescription ID');
    }

    const deletedAt = new Date();
    const expiresAt = new Date(deletedAt.getTime() + 60_000);
    const data = await this.prescriptionModel
      .findOneAndUpdate(
        { _id: id, delete_status: { $ne: true } },
        { $set: { delete_status: true, deletedAt, expiresAt } },
        { new: true },
      )
      .exec();

    if (!data) {
      throw new NotFoundException('Prescription not found');
    }

    return {
      status: 200,
      message: 'Prescription deleted successfully',
      data,
      error: null,
    };
  }
}
