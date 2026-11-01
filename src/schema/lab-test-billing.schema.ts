import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabTestBillingDocument = LabTestBilling & Document;

@Schema({ timestamps: true })
export class LabTestBilling {
    @Prop({ required: true, trim: true })
    testName: string;
    @Prop({ required: true, trim: true })
    actualPrice: number;
    @Prop({ required: true, trim: true })
    sellingPrice: number;
    @Prop({ type: Types.ObjectId, ref: 'Clinic', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    clinicId: Types.ObjectId;
}

export const LabTestBillingSchema = SchemaFactory.createForClass(LabTestBilling);

LabTestBillingSchema.index({ clinicId: 1 });
