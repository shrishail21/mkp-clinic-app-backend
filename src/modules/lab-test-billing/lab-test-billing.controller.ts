import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LabTestBillingService } from './lab-test-billing.service';
import { CreateLabTestBillingDto } from './dto/create-lab-test-billing.dto';
import { UpdateLabTestBillingDto } from './dto/update-lab-test-billing.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab-test-billing')
export class LabTestBillingController {
  constructor(private readonly labTestBillingService: LabTestBillingService) {}

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Post()
  create(@Body() createLabTestBillingDto: CreateLabTestBillingDto): unknown {
    const result: unknown = this.labTestBillingService.create(
      createLabTestBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get()
  findAll(): unknown {
    const result: unknown = this.labTestBillingService.findAll();
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':id')
  findOne(@Param('id') id: string): unknown {
    const result: unknown = this.labTestBillingService.findOne(id);
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateLabTestBillingDto: UpdateLabTestBillingDto,
  ): unknown {
    const result: unknown = this.labTestBillingService.update(
      id,
      updateLabTestBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Delete(':id')
  remove(@Param('id') id: string): unknown {
    const result: unknown = this.labTestBillingService.remove(id);
    return result;
  }
}
