import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicinesBillingDocument = MedicinesBilling & Document;

@Schema({ timestamps: true })
export class MedicinesBilling {
    @Prop({ required: true, trim: true })
    medicineName: string;
    @Prop({ required: true })
    quantity: number;
    @Prop({ required: true })
    actualPricePerTablet: number;
    @Prop({ required: true })
    sellingPricePerTablet: number;
    @Prop({ type: Types.ObjectId, ref: 'Clinic', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  } })
    clinicId: Types.ObjectId;
}

export const MedicinesBillingSchema = SchemaFactory.createForClass(MedicinesBilling);

MedicinesBillingSchema.index({ clinicId: 1 });
