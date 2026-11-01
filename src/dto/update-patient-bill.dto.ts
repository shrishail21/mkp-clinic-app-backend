import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientBillDto } from './create-patient-bill.dto';

export class UpdatePatientBillDto extends PartialType(CreatePatientBillDto) {}