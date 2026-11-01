import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTestBillingDto } from './create-lab-test-billing.dto';

export class UpdateLabTestBillingDto extends PartialType(CreateLabTestBillingDto) {}
