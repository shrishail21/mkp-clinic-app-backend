import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePatientBillDto {
  @IsString()
  patientId: string;

  @IsArray()
  items: { item: string; quantity: number, price:number}[];

  @IsNumber()
  taxPercent: number;

  @IsString()
  billNotes: string;

  @IsNumber()
  taxAmount: number;

  @IsNumber()
  totalAmount: number; 


}