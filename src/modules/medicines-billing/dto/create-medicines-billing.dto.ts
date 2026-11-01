import { IsString, IsNumber } from 'class-validator';

export class CreateMedicinesBillingDto {
    @IsString()
    medicineName: string;
    @IsNumber()
    quantity: number;
    @IsNumber()
    actualPricePerTablet: number;
    @IsNumber()
    sellingPricePerTablet: number;
    @IsString()
    clinicId: string;
}
