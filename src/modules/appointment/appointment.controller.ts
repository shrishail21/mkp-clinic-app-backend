import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../../dto/update-appointment.dto';
import { UpdateStatusDto } from '../../dto/update-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';

type AuthenticatedRequest = {
  user: { id: string; role: Role; clinicId: string };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('create')
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    createAppointmentDto.clinicId = request.user.clinicId;
    return this.appointmentService.create(createAppointmentDto);
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('doctor')
  async findByDoctor(
    @Headers('doctorId') doctorId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      request.user.role === Role.DOCTOR &&
      String(doctorId) !== String(request.user.id)
    ) {
      return [];
    }
    return this.appointmentService.findByDoctor(
      doctorId,
      request.user.clinicId,
    );
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, updateStatusDto.status);
  }

  @Roles([Role.ADMIN, Role.DOCTOR])
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Roles([Role.ADMIN])
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }
}
