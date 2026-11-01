import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingItemDto } from './create-billing-item.dto';

export class UpdateBillingItemDto extends PartialType(CreateBillingItemDto) {}