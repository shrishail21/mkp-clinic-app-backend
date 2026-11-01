import {
  Body,
  Controller,
  Delete,
  Get,
  ForbiddenException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role } from 'src/schema/user.schema';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { PrescriptionDto } from 'src/dto/prescription.dto';
import { UpdatePrescriptionDto } from 'src/dto/update-prescription.dto';
import { PaginationQueryDto } from 'src/dto/pagination-query.dto';
import { ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Types } from 'mongoose';
import { PrescriptionCompanyAnalyticsQueryDto } from 'src/dto/prescription-company-analytics-query.dto';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  private readonly logger = new Logger(PrescriptionsController.name);

  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('/add/:id')
  @Roles([Role.ADMIN, Role.DOCTOR])
  async addPrescription(
    @Param('id') id: string,
    @Body() PrescriptionData: PrescriptionDto,
    @Request() req: { user: { id: string | Types.ObjectId } },
  ) {
    this.logger.log(`Adding prescription for patient: ${id}`);
    const data = await this.prescriptionsService.createPrescription(
      id,
      PrescriptionData,
      String(req.user.id),
    );
    return data;
  }

  @Get('/analytics/companies')
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  async getCompanyPrescriptionAnalytics(
    @Request()
    req: { user: { clinicId?: string | Types.ObjectId | null } },
    @Query(new ValidationPipe({ transform: true }))
    query: PrescriptionCompanyAnalyticsQueryDto,
  ) {
    const clinicId = req.user.clinicId;
    if (!clinicId) {
      throw new ForbiddenException('Admin is not assigned to a clinic');
    }
    return this.prescriptionsService.getCompanyPrescriptionAnalytics(
      query.page,
      query.limit,
      query.doctorId,
      query.month,
      query.year,
      String(clinicId),
    );
  }

  @Get('/patient/:id')
  @Roles([Role.ADMIN, Role.DOCTOR])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getPrescriptionsByPatientId(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true }))
    pagination: PaginationQueryDto,
  ) {
    this.logger.log(`Fetching prescriptions for patient: ${id}`);
    const data = await this.prescriptionsService.getPrescriptionsByPatientId(
      id,
      pagination.page,
      pagination.limit,
    );
    return data;
  }

  @Get('/:id')
  @Roles([Role.ADMIN, Role.DOCTOR])
  async getPrescriptionByIdWithPatientData(@Param('id') id: string) {
    this.logger.log(`Fetching prescription with ID: ${id}`);
    const data =
      await this.prescriptionsService.getPrescriptionsByIdWithPatientData(id);
    return data;
  }

  @Put('/:id')
  @Roles([Role.ADMIN, Role.DOCTOR])
  async updatePrescription(
    @Param('id') id: string,
    @Body() updateData: UpdatePrescriptionDto,
  ) {
    this.logger.log(`Updating prescription with ID: ${id}`);
    const data = await this.prescriptionsService.updatePrescription(
      id,
      updateData,
    );
    return data;
  }

  @Delete('/:id')
  @Roles([Role.ADMIN, Role.DOCTOR])
  async deletePrescription(@Param('id') id: string) {
    this.logger.log(`Deleting prescription with ID: ${id}`);
    return this.prescriptionsService.deletePrescription(id);
  }
}
