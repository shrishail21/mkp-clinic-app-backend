import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { PaginationQueryDto } from 'src/dto/pagination-query.dto';
import { Throttle } from '@nestjs/throttler';
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  findAll(
    @Query(new ValidationPipe({ transform: true }))
    pagination: PaginationQueryDto,
  ) {
    return this.invoiceService.findAllWithPagination(pagination.page, pagination.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Get('clinic/:clinicId')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  findByClinic(
    @Param('clinicId') clinicId: string,
    @Query(new ValidationPipe({ transform: true }))
    pagination: PaginationQueryDto,
  ) {
    return this.invoiceService.findByClinicWithPagination(
      clinicId,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('patient/:patientId/latest')
  getLatestByPatient(@Param('patientId') patientId: string) {
    return this.invoiceService.getLatestInvoiceByPatient(patientId);
  }

  @Get('patient/:patientId')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query(new ValidationPipe({ transform: true }))
    pagination: PaginationQueryDto,
  ) {
    return this.invoiceService.findByPatientWithPagination(
      patientId,
      pagination.page,
      pagination.limit,
    );
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }
}
