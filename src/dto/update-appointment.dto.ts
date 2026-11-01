import { IsOptional, IsString, IsDateString, IsEnum, Matches } from 'class-validator';
import { AppointmentStatus } from '../schema/appointment.schema';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_MESSAGE = 'Time must be in HH:mm format (e.g. 09:30, 21:45)';

export class UpdateAppointmentDto {
    @IsOptional()
    @IsString()
    patientId?: string;

    @IsOptional()
    @IsString()
    clinicId?: string;

    @IsOptional()
    @IsString()
    doctorId?: string;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX, { message: TIME_MESSAGE })
    timeFrom?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX, { message: TIME_MESSAGE })
    timeTo?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}
