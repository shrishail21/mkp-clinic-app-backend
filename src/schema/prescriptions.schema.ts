import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Patient } from './patient.schema';

export type PrescriptionDocument = Prescription & Document;

class Drug {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  quantity: string;

  @Prop({ required: true })
  frequency: string;

  @Prop({ required: true })
  remarks?: string;
}

@Schema({ timestamps: true, autoIndex: true })
export class Prescription {
  @Prop({ type: [Drug], required: true })
  drug: Drug[];

  @Prop()
  Diagnosis?: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: Patient.name,
    trim: true,
    index: true,
  })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  prescribedBy?: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  weight: number;

  @Prop({ default: null })
  bloodPressure?: string;

  @Prop({ default: null })
  pulseRate?: number;

  @Prop({ default: null })
  bloodSugarLevel?: number;

  @Prop({ default: false })
  delete_status?: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Date, default: null })
  expiresAt?: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
PrescriptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
