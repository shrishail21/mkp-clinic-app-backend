import { IsString, IsNumber } from 'class-validator';

export class CreateLabTestBillingDto {
    @IsString()
    testName: string;
    @IsNumber()
    actualPrice: number;
    @IsNumber()
    sellingPrice: number;
    @IsString()
    clinicId: string;
}
