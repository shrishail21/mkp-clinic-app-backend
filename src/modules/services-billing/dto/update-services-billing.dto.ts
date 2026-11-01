import { PartialType } from '@nestjs/mapped-types';
import { CreateServicesBillingDto } from './create-services-billing.dto';

export class UpdateServicesBillingDto extends PartialType(CreateServicesBillingDto) {
    
}
