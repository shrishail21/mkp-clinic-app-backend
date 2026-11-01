import { IsEnum, IsMongoId, ValidateIf } from 'class-validator';
import { Role } from '../schema/user.schema';

export class GetReceptionistsDto {
  @IsEnum(Role, {
    message: `role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role: Role;

  @ValidateIf((data: GetReceptionistsDto) => data.role === Role.DOCTOR)
  @IsMongoId()
  doctorId: string;

  @ValidateIf((data: GetReceptionistsDto) => data.role !== Role.DOCTOR)
  @IsMongoId()
  clinicId: string;
}
