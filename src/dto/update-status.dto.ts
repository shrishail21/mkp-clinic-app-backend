import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../schema/appointment.schema';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus, {
    message: `status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  status: AppointmentStatus;
}
