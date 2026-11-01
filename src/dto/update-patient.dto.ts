import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { Gender } from '../schema/patient.schema';

export class UpdatePatientDto {
    
    @IsOptional()
    @IsString()
    name?: string;
    
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;
    
    @IsOptional()
    @IsDateString()
    birthday?: Date;
    
    @IsOptional()
    @IsString()
    phoneNumber?: string;
    
    @IsOptional()
    @IsNumber()
    weight?: number;
    
    @IsOptional()
    @IsString()
    address?: string;
    
    @IsOptional()
    @IsString()
    bloodPressure?: string;
    
    @IsOptional()
    @IsNumber()
    pulseRate?: number;
    
    @IsOptional()
    @IsNumber()
    bloodSugarLevel?: number;
}
