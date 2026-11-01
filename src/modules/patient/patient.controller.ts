import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PatientDto } from 'src/dto/patient.dto';
import { UpdatePatientDto } from 'src/dto/update-patient.dto';
import { PatientSearchDto } from 'src/dto/patient-search.dto';
import { PatientService } from './patient.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patient')
export class PatientController {
  private readonly logger = new Logger(PatientController.name);

  constructor(private readonly patientService: PatientService) {}

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('create')
  async createPatient(@Body() patientData: PatientDto): Promise<any> {
    this.logger.log('Received patient creation request');
    return this.patientService.createPatient(patientData);
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('getPatient')
  async getPatients(@Body() searchData: PatientSearchDto): Promise<any> {
    return this.patientService.getPatient(searchData);
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Get('/:id')
  async getSinglePatient(@Param('id') id: string): Promise<any> {
    return this.patientService.getSinglePatient(id);
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @UseGuards(RolesGuard)
  @Put('/:id')
  async updatePatient(
    @Param('id') id: string,
    @Body() updatePatientData: UpdatePatientDto,
  ): Promise<any> {
    return this.patientService.updatePatient(id, updatePatientData);
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Delete('/:id')
  async deletePatient(@Param('id') id: string): Promise<any> {
    return this.patientService.deletePatient(id);
  }
}
