import { IsString, IsNumber } from 'class-validator';

export class CreateServicesBillingDto {
    @IsString()
    serviceName: string;
    @IsNumber()
    actualPrice: number;
    @IsNumber()
    sellingPrice: number;
    @IsString()
    clinicId: string;
}
