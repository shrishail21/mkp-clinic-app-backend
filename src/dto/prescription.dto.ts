import { Type } from 'class-transformer';
import {
    IsArray,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class PrescriptionDrugDto {
    @IsString()
    name: string;

    @IsString()
    content: string;

    @IsString()
    company: string;

    @IsString()
    quantity: string;

    @IsString()
    frequency: string;

    @IsString()
    remarks: string;
}

export class PrescriptionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PrescriptionDrugDto)
    drug: PrescriptionDrugDto[];

    @IsNumber()
    weight: number;

    @IsOptional()
    @IsString()
    bloodPressure?: string;

    @IsOptional()
    @IsNumber()
    pulseRate?: number;

    @IsOptional()
    @IsNumber()
    bloodSugarLevel?: number;

    @IsOptional()
    @IsString()
    Diagnosis?: string;
}