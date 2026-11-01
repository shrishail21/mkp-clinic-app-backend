import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Role } from '../schema/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsMongoId()
  clinicId?: string;

  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @IsOptional()
  @IsMongoId()
  adminId?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}