import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from '../../schema/appointment.schema';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../../dto/update-appointment.dto';
import { User, Role } from '../../schema/user.schema';

// ---------------------------------------------------------------------------
// Helper: convert "HH:mm" string → total minutes since midnight (0–1439)
//
// Why minutes instead of string comparison?
//   "9:00" vs "21:00" — lexicographic order gives "9:00" > "21:00" (wrong!)
//   Zero-padding fixes that, but integer math is safer, faster, and indexable.
//
// Examples:
//   "00:00" → 0
//   "09:30" → 570
//   "21:45" → 1305
//   "23:59" → 1439
// ---------------------------------------------------------------------------
export function timeToMinutes(time: string): number {
  const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw new BadRequestException(
      `Invalid time format "${time}". Expected HH:mm (e.g. 09:30)`,
    );
  }
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// ---------------------------------------------------------------------------
// Overlap condition (standard interval overlap):
//
//   Two intervals [A_start, A_end) and [B_start, B_end) overlap when:
//     A_start < B_end  AND  A_end > B_start
//
// Visual examples:
//   Existing:  |----21:30----21:45----|
//   New:            |--21:32------21:50--|   ← OVERLAP  (21:32 < 21:45 && 21:50 > 21:30)
//
//   Existing:  |----21:30----21:45----|
//   New:                              |--21:45--22:00--|  ← NO overlap (21:45 == 21:45, not <)
//
//   Existing:  |----21:30----21:45----|
//   New:       |----21:30----21:45----|  ← OVERLAP (exact match)
//
// Edge cases handled:
//   - Adjacent slots (end == start) are NOT overlapping — back-to-back is fine
//   - Exact same slot IS overlapping
//   - New slot fully inside existing → overlap
//   - New slot fully wrapping existing → overlap
// ---------------------------------------------------------------------------

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    try {
      this.logger.log(
        `Creating appointment — patient: ${createAppointmentDto.patientId}, ` +
          `doctor: ${createAppointmentDto.doctorId}, ` +
          `date: ${String(createAppointmentDto.date)}, ` +
          `time: ${createAppointmentDto.timeFrom}–${createAppointmentDto.timeTo}`,
      );

      // --- Validate and convert times to minutes ---
      const newStart = timeToMinutes(createAppointmentDto.timeFrom);
      const newEnd = timeToMinutes(createAppointmentDto.timeTo);

      if (
        !Types.ObjectId.isValid(createAppointmentDto.doctorId) ||
        !Types.ObjectId.isValid(createAppointmentDto.clinicId)
      ) {
        throw new BadRequestException('A valid clinic and doctor are required');
      }

      const doctor = await this.userModel
        .findOne({
          _id: new Types.ObjectId(createAppointmentDto.doctorId),
          clinicId: new Types.ObjectId(createAppointmentDto.clinicId),
          role: { $in: [Role.DOCTOR, Role.ADMIN] },
        })
        .select('_id')
        .exec();

      if (!doctor) {
        throw new BadRequestException(
          'Selected doctor does not belong to this clinic',
        );
      }

      if (newEnd <= newStart) {
        throw new BadRequestException(
          `timeTo (${createAppointmentDto.timeTo}) must be after timeFrom (${createAppointmentDto.timeFrom})`,
        );
      }

      // --- Normalise date to day boundaries (UTC-safe) ---
      const appointmentDate = new Date(createAppointmentDto.date);
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // --- Overlap query using integer minutes ---
      //
      // MongoDB query equivalent of:  newStart < existingEnd && newEnd > existingStart
      //
      // This runs entirely in the database using the compound index:
      //   { doctorId, date, timeFromMinutes, timeToMinutes }
      // No need to fetch all records and loop in application code.
      const overlappingAppointment = await this.appointmentModel.findOne({
        doctorId: new Types.ObjectId(createAppointmentDto.doctorId),
        date: { $gte: startOfDay, $lte: endOfDay },
        delete_status: false,
        status: { $ne: AppointmentStatus.CANCELLED },
        timeFromMinutes: { $lt: newEnd }, // existing slot starts before new slot ends
        timeToMinutes: { $gt: newStart }, // existing slot ends after new slot starts
      });

      if (overlappingAppointment) {
        this.logger.warn(
          `Overlap detected — doctor: ${createAppointmentDto.doctorId}, ` +
            `existing: ${overlappingAppointment.timeFrom}–${overlappingAppointment.timeTo}, ` +
            `requested: ${createAppointmentDto.timeFrom}–${createAppointmentDto.timeTo}`,
        );
        throw new BadRequestException(
          `Time slot ${createAppointmentDto.timeFrom}–${createAppointmentDto.timeTo} overlaps ` +
            `with an existing appointment (${overlappingAppointment.timeFrom}–${overlappingAppointment.timeTo})`,
        );
      }

      // --- Persist with computed minute fields ---
      const payload = {
        ...createAppointmentDto,
        status: createAppointmentDto.status ?? AppointmentStatus.WAITING,
        timeFromMinutes: newStart,
        timeToMinutes: newEnd,
      };

      const created = new this.appointmentModel(payload);
      const result = await created.save();
      this.logger.log(`Appointment created — ID: ${String(result._id)}`);
      return result;
    } catch (error: unknown) {
      this.logError('Failed to create appointment', error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment | null> {
    try {
      this.logger.log(
        `Updating status of appointment ID: ${id} to "${status}"`,
      );

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId: ${id}`);
        return null;
      }

      // Set expiresAt when status is terminal — TTL index will delete the
      // document 30 minutes after this timestamp.
      const terminalStatuses = [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ];
      const expiresAt = terminalStatuses.includes(status) ? new Date() : null;

      if (expiresAt) {
        this.logger.log(
          `Appointment ID: ${id} marked as "${status}" — scheduled for deletion at ` +
            `${new Date(expiresAt.getTime() + 30 * 60 * 1000).toISOString()} (30 min TTL)`,
        );
      }

      const result = await this.appointmentModel
        .findByIdAndUpdate(id, { status, expiresAt }, { new: true })
        .populate('patientId', 'name phoneNumber')
        .populate('clinicId', 'name address')
        .populate('doctorId', 'name specialization')
        .exec();

      if (result) {
        this.logger.log(
          `Appointment status updated — ID: ${id}, status: ${status}`,
        );
      } else {
        this.logger.warn(`Appointment not found for status update — ID: ${id}`);
      }
      return result;
    } catch (error: unknown) {
      this.logError(`Failed to update status for appointment ${id}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment | null> {
    try {
      this.logger.log(`Updating appointment ID: ${id}`);

      // Recompute minute fields if times are being updated
      const updates: Record<string, unknown> = { ...updateAppointmentDto };
      if (updateAppointmentDto.timeFrom) {
        updates.timeFromMinutes = timeToMinutes(updateAppointmentDto.timeFrom);
      }
      if (updateAppointmentDto.timeTo) {
        updates.timeToMinutes = timeToMinutes(updateAppointmentDto.timeTo);
      }

      const result = await this.appointmentModel
        .findByIdAndUpdate(id, updates, { new: true })
        .exec();

      if (result) {
        this.logger.log(`Appointment updated — ID: ${id}`);
      } else {
        this.logger.warn(`Appointment not found for update — ID: ${id}`);
      }
      return result;
    } catch (error: unknown) {
      this.logError(`Failed to update appointment ${id}`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<Appointment | null> {
    try {
      this.logger.log(`Soft deleting appointment ID: ${id}`);
      const result = await this.appointmentModel
        .findByIdAndUpdate(
          id,
          { delete_status: true, deletedAt: new Date() },
          { new: true },
        )
        .exec();

      if (result) {
        this.logger.log(`Appointment soft deleted — ID: ${id}`);
      } else {
        this.logger.warn(`Appointment not found for deletion — ID: ${id}`);
      }
      return result;
    } catch (error: unknown) {
      this.logError(`Failed to delete appointment ${id}`, error);
      throw error;
    }
  }

  async findByDoctor(
    doctorId: string,
    clinicId: string,
  ): Promise<Appointment[]> {
    try {
      this.logger.log(`Fetching appointments for doctor: ${doctorId}`);

      if (
        !Types.ObjectId.isValid(doctorId) ||
        !Types.ObjectId.isValid(clinicId)
      ) {
        this.logger.warn(`Invalid doctorId or clinicId: ${doctorId}`);
        return [];
      }

      const result = await this.appointmentModel.aggregate<Appointment>([
        {
          $match: {
            doctorId: new Types.ObjectId(doctorId),
            clinicId: new Types.ObjectId(clinicId),
            delete_status: false,
          },
        },
        // Assign sort priority: waiting=0 (top), completed=1, cancelled=2 (bottom)
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$status', AppointmentStatus.WAITING] },
                    then: 0,
                  },
                  {
                    case: { $eq: ['$status', AppointmentStatus.COMPLETED] },
                    then: 1,
                  },
                  {
                    case: { $eq: ['$status', AppointmentStatus.CANCELLED] },
                    then: 2,
                  },
                ],
                default: 99,
              },
            },
          },
        },
        { $sort: { statusOrder: 1, date: 1, timeFromMinutes: 1 } },
        { $unset: 'statusOrder' },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patientId',
            pipeline: [{ $project: { name: 1, phoneNumber: 1, uhid: 1 } }],
          },
        },
        { $unwind: { path: '$patientId', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'clinics',
            localField: 'clinicId',
            foreignField: '_id',
            as: 'clinicId',
            pipeline: [{ $project: { name: 1, address: 1 } }],
          },
        },
        { $unwind: { path: '$clinicId', preserveNullAndEmptyArrays: true } },
      ]);

      this.logger.log(
        `Found ${result.length} appointments for doctor: ${doctorId}`,
      );
      return result;
    } catch (error: unknown) {
      this.logError(
        `Failed to fetch appointments for doctor ${doctorId}`,
        error,
      );
      throw error;
    }
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    try {
      this.logger.log(`Fetching appointments for patient: ${patientId}`);

      if (!Types.ObjectId.isValid(patientId)) {
        this.logger.warn(`Invalid patientId: ${patientId}`);
        return [];
      }

      const result = await this.appointmentModel
        .find({
          patientId: new Types.ObjectId(patientId),
          delete_status: false,
        })
        .populate('clinicId', 'name address')
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, timeFromMinutes: 1 })
        .exec();
      this.logger.log(
        `Found ${result.length} appointments for patient: ${patientId}`,
      );
      return result;
    } catch (error: unknown) {
      this.logError(
        `Failed to fetch appointments for patient ${patientId}`,
        error,
      );
      throw error;
    }
  }

  async findByDate(date: Date): Promise<Appointment[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      this.logger.log(`Fetching appointments for date: ${dateStr}`);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.appointmentModel
        .find({
          date: { $gte: startOfDay, $lte: endOfDay },
          delete_status: false,
        })
        .populate('patientId', 'name phoneNumber email')
        .populate('clinicId', 'name address')
        .populate('doctorId', 'name specialization')
        .sort({ timeFromMinutes: 1 })
        .exec();
      this.logger.log(
        `Found ${result.length} appointments for date: ${dateStr}`,
      );
      return result;
    } catch (error: unknown) {
      this.logError(
        `Failed to fetch appointments for date ${date.toISOString()}`,
        error,
      );
      throw error;
    }
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
      return;
    }
    this.logger.error(`${message}: ${String(error)}`);
  }
}
