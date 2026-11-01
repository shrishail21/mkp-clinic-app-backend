import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServicesBillingDocument = ServicesBilling & Document;

@Schema({ timestamps: true })
export class ServicesBilling {
    @Prop({ required: true, trim: true })
    serviceName: string;
    @Prop({ required: true, trim: true })
    actualPrice: number;
    @Prop({ required: true, trim: true })
    sellingPrice: number;
    @Prop({ type: Types.ObjectId, ref: 'Clinic' ,set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    clinicId: Types.ObjectId;

}

export const ServicesBillingSchema = SchemaFactory.createForClass(ServicesBilling);

ServicesBillingSchema.index({ clinicId: 1 });