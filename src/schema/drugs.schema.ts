import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DrugsDocument = Drugs & Document;

export const normalizeDrugSearchText = (value: string): string =>
  value.toLowerCase().replace(/-/g, '');

@Schema({ timestamps: true, autoIndex: true })
export class Drugs {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  name: string;

  @Prop({ select: false })
  nameNormalized: string;

  @Prop({ select: false })
  contentNormalized: string;

  @Prop({ select: false })
  companyNormalized: string;
}

export const DrugsSchema = SchemaFactory.createForClass(Drugs);

DrugsSchema.index({ nameNormalized: 1 });
DrugsSchema.index({ contentNormalized: 1 });
DrugsSchema.index({ companyNormalized: 1 });

DrugsSchema.pre('validate', function () {
  if (typeof this.name === 'string') {
    this.nameNormalized = normalizeDrugSearchText(this.name);
  }
  if (typeof this.content === 'string') {
    this.contentNormalized = normalizeDrugSearchText(this.content);
  }
  if (typeof this.company === 'string') {
    this.companyNormalized = normalizeDrugSearchText(this.company);
  }
});
