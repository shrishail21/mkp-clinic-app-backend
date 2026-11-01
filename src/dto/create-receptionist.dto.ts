import {
  Equals,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Role } from '../schema/user.schema';

export class CreateReceptionistDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @Equals(Role.RECEPTIONIST)
  role: Role;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain an uppercase letter, a number, and a special character',
  })
  password: string;

  @IsMongoId()
  clinicId: string;

  @IsOptional()
  @IsMongoId()
  adminId?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
