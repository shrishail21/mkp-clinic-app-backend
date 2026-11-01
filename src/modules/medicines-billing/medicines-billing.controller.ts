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
import { MedicinesBillingService } from './medicines-billing.service';
import { CreateMedicinesBillingDto } from './dto/create-medicines-billing.dto';
import { UpdateMedicinesBillingDto } from './dto/update-medicines-billing.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicines-billing')
export class MedicinesBillingController {
  constructor(
    private readonly medicinesBillingService: MedicinesBillingService,
  ) {}

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Post()
  create(
    @Body() createMedicinesBillingDto: CreateMedicinesBillingDto,
  ): unknown {
    const result: unknown = this.medicinesBillingService.create(
      createMedicinesBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get()
  findAll(): unknown {
    const result: unknown = this.medicinesBillingService.findAll();
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':id')
  findOne(@Param('id') id: string): unknown {
    const result: unknown = this.medicinesBillingService.findOne(id);
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicinesBillingDto: UpdateMedicinesBillingDto,
  ): unknown {
    const result: unknown = this.medicinesBillingService.update(
      id,
      updateMedicinesBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Delete(':id')
  remove(@Param('id') id: string): unknown {
    const result: unknown = this.medicinesBillingService.remove(id);
    return result;
  }
}
