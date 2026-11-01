import { IsOptional, IsString } from 'class-validator';

export class PatientBillingFilterDto {
  @IsString()
  @IsOptional()
  doctorId: string;

  @IsString()
  @IsOptional()
  date: string;

  @IsString()
  @IsOptional()
  month: string;
}
