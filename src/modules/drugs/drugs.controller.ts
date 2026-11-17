import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DrugsService } from './drugs.service';
import { DrugSearchDto } from 'src/dto/drug-search.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';
import { CreateDrugDto } from 'src/dto/create-drug.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
@Controller('drugs')
export class DrugsController {
  constructor(private readonly drugService: DrugsService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  async getDrugs(@Body() value: DrugSearchDto) {
    const drugs = await this.drugService.getDrugsByName(value.name);
    if (drugs.length === 0) {
      return { message: 'No drugs found', status: 404 };
    }
    return {
      message: 'Drugs retrieved successfully',
      status: 200,
      data: drugs,
    };
  }

  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  async createDrug(@Body() drugData: CreateDrugDto) {
    const drug = await this.drugService.createDrug(drugData);
    return {
      message: 'Drug created successfully',
      status: HttpStatus.CREATED,
      data: drug,
    };
  }
}
