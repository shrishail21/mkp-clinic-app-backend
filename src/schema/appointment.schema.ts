import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  WAITING = 'waiting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, autoIndex: true })
export class Appointment {

  @Prop({
    type: Types.ObjectId, ref: 'Patient', required: true, index: true,
    set: (value: string | Types.ObjectId) => {
      if (typeof value === 'string') return new Types.ObjectId(value);
      return value;
    },
  })
  patientId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId, ref: 'Clinic', required: true, index: true,
    set: (value: string | Types.ObjectId) => {
      if (typeof value === 'string') return new Types.ObjectId(value);
      return value;
    },
  })
  clinicId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId, ref: 'User', required: true, index: true,
    set: (value: string | Types.ObjectId) => {
      if (typeof value === 'string') return new Types.ObjectId(value);
      return value;
    },
  })
  doctorId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  // Human-readable time strings (HH:mm) — kept for display purposes
  @Prop({ required: true })
  timeFrom: string;

  @Prop({ required: true })
  timeTo: string;

  // Integer minutes since midnight (0–1439) — used for overlap queries
  // e.g. "09:30" → 570,  "21:45" → 1305
  @Prop({ required: true, index: true })
  timeFromMinutes: number;

  @Prop({ required: true, index: true })
  timeToMinutes: number;

  @Prop({ type: String, enum: AppointmentStatus, default: AppointmentStatus.WAITING, index: true })
  status: AppointmentStatus;

  @Prop({ default: false })
  delete_status?: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  // TTL field — set when status becomes 'completed' or 'cancelled'.
  // MongoDB will automatically delete the document 30 minutes (1800s) after this timestamp.
  // Null while the appointment is still 'waiting' so the TTL index ignores it.
  @Prop({ type: Date, default: null })
  expiresAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Compound indexes for overlap detection and common queries
AppointmentSchema.index({ doctorId: 1, date: 1, timeFromMinutes: 1, timeToMinutes: 1 });
AppointmentSchema.index({ clinicId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1, date: 1 });

// TTL index — deletes document 1800 seconds (30 min) after expiresAt is set.
// MongoDB checks this roughly every 60 seconds, so actual deletion may be
// up to ~1 minute after the 30-min mark. Documents where expiresAt is null
// are ignored by this index.
AppointmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 1800 });
