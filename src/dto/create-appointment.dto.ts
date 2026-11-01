import { IsString, IsOptional, IsDateString, IsEnum, Matches } from 'class-validator';
import { AppointmentStatus } from '../schema/appointment.schema';

// Enforces zero-padded HH:mm format: 00:00 – 23:59
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_MESSAGE = 'Time must be in HH:mm format (e.g. 09:30, 21:45)';

export class CreateAppointmentDto {
    @IsString()
    patientId: string;

    @IsString()
    clinicId: string;

    @IsString()
    doctorId: string;

    @IsDateString()
    date: Date;

    @IsEnum(AppointmentStatus)
    @IsOptional()
    status?: AppointmentStatus = AppointmentStatus.WAITING;

    @IsString()
    @Matches(TIME_REGEX, { message: TIME_MESSAGE })
    timeFrom: string;

    @IsString()
    @Matches(TIME_REGEX, { message: TIME_MESSAGE })
    timeTo: string;
}
