import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type UserDocument = User & Document;

export enum Role {
    DOCTOR = 'Doctor',
    RECEPTIONIST = 'Receptionist',
    ADMIN = 'Admin'
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, enum: Role })
    role: Role;

    // ✅ Clinic Reference
    @Prop({ type: Types.ObjectId, ref: 'Clinic' ,set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    clinicId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    doctorId?:Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'User', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    adminId?: Types.ObjectId; 

    @Prop({required: false})
    specialization?: string;

    @Prop({ required: false })
    phoneNumber?: string;

    @Prop({ default: false })
    delete_status?: boolean;

    @Prop({ type: Date, default: null })
    deletedAt?: Date;

    @Prop({ type: Date, default: null })
    createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ clinicId: 1 });
UserSchema.index({ doctorId: 1 });
UserSchema.index({ adminId: 1 });