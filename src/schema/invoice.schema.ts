import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface InvoiceItem {
  id: string;
  type: 'service' | 'lab' | 'medicines';
  itemId: string;
  itemName?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
}

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true, autoIndex: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Patient', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  }, required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  }, required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Clinic', set: (value: string | Types.ObjectId) => {
    if (typeof value === 'string') {
      return new Types.ObjectId(value);
    }
    return value;
  }, required: true })
  clinicId: Types.ObjectId;

  @Prop({ type: [Object], required: true })
  items: InvoiceItem[];

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ required: true, default: 0 })
  taxRate: number;

  @Prop({ required: true, default: 0 })
  taxAmount: number;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({ required: true, default: 0 })
  profit: number;

  @Prop({ required: true, default: 0 })
  profitMargin: number;

  @Prop({ required: true, default: 0 })
  actualCostSubtotal: number;

  @Prop({ required: true, default: 0 })
  actualCostTaxAmount: number;

  @Prop({ required: true, default: 0 })
  actualCostTotal: number;

  @Prop({ required: true, default: 'draft' })
  status: string;

  @Prop({ required: true, default: 'cash' })
  paymentMethod: string;

  @Prop({ required: false })
  amountPaid: number;

  @Prop({ required: false})
  amountRemaining: number;

  @Prop({ default: false })
  delete_status?: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Date, default: null })
  expiresAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ clinicId: 1 });
InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ doctorId: 1 });
InvoiceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
