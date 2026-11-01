import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';         
import { Document } from 'mongoose';

export type ClinicDocument = Clinic & Document;
@Schema({ timestamps: true, autoIndex: true })
export class Clinic {
    @Prop({ required: true })
    name: string;
    @Prop({ required: true })
    address: string;
    @Prop({ required: true })
    phoneNumber: string;
    @Prop({ required: true })
    email: string;
    @Prop({ type: Date, default: null })
    createdAt: Date;
    @Prop({ type: Date, default: null })
    updatedAt: Date;
    @Prop({ default: false })
    delete_status?: boolean
    @Prop({ type: Date, default: null })
    deletedAt?: Date;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);