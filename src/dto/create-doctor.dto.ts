import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../schema/user.schema';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @IsString()
  phoneNumber: string;

  @IsEnum(Role, { message: `role must be one of: ${Object.values(Role).join(', ')}` })
  role: Role;

  @IsString()
  specialization: string;

  @IsString()
  clinicId: string;

  @IsString()
  @IsOptional()
  adminId?: string;
}
