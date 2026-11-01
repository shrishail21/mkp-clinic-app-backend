import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

@Schema({ timestamps: true, autoIndex: true })
export class Patient {

  @Prop({ required: true, index: true, trim: true })
  name: string;


  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true, index: true ,
    set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  }
  })
  clinicId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, trim: true })
  uhid: string;

  @Prop({ type: String, enum: Gender, required: true })
  gender: Gender;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: true })
  weight: number;

  @Prop({ default: null })
  address?: string;

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

export const PatientSchema = SchemaFactory.createForClass(Patient);

// 🔥 Better compound index
PatientSchema.index({ clinicId: 1, name: 1 });
PatientSchema.index({ clinicId: 1, phoneNumber: 1 });
PatientSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });