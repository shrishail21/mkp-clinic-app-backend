import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ServicesBillingService } from './services-billing.service';
import { CreateServicesBillingDto } from './dto/create-services-billing.dto';
import { UpdateServicesBillingDto } from './dto/update-services-billing.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services-billing')
export class ServicesBillingController {
  private readonly logger = new Logger(ServicesBillingController.name);

  constructor(
    private readonly servicesBillingService: ServicesBillingService,
  ) {}

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Post()
  create(@Body() createServicesBillingDto: CreateServicesBillingDto): unknown {
    this.logger.log('Received service billing creation request');
    const result: unknown = this.servicesBillingService.create(
      createServicesBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get()
  findAll(): unknown {
    const result: unknown = this.servicesBillingService.findAll();
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':id')
  findOne(@Param('id') id: string): unknown {
    const result: unknown = this.servicesBillingService.findOne(id);
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateServicesBillingDto: UpdateServicesBillingDto,
  ): unknown {
    const result: unknown = this.servicesBillingService.update(
      id,
      updateServicesBillingDto,
    );
    return result;
  }

  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Delete(':id')
  remove(@Param('id') id: string): unknown {
    this.logger.log('Received service billing deletion request');
    const result: unknown = this.servicesBillingService.remove(id);
    return result;
  }
}
