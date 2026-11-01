import { PartialType } from '@nestjs/mapped-types';
import { PrescriptionDto } from './prescription.dto';

export class UpdatePrescriptionDto extends PartialType(PrescriptionDto) {}