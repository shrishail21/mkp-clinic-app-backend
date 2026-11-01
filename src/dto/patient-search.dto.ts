import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class PatientSearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsMongoId()
  clinicId?: string;
}