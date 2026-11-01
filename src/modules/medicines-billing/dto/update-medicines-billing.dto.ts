import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicinesBillingDto } from './create-medicines-billing.dto';

export class UpdateMedicinesBillingDto extends PartialType(CreateMedicinesBillingDto) {}
