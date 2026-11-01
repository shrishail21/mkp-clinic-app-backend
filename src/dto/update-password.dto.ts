import { IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain an uppercase letter, a number, and a special character',
  })
  newPassword: string;
}