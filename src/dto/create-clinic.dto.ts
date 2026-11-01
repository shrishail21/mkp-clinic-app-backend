import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  phoneNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  adminName: string;

  @IsString()
  @MinLength(8)
  password: string;
}