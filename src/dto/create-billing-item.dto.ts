import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBillingItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  doctorId: string;

}
