import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../schema/user.schema';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain an uppercase letter, a number, and a special character',
  })
  password: string;

  @IsEnum(Role)
  role: Role;

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