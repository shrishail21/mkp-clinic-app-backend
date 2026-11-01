import { Body, Controller, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from 'src/dto/create-clinic.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('clinic')
export class ClinicController {
    private readonly logger = new Logger(ClinicController.name);

    constructor(private readonly clinicService: ClinicService) {}
    @Post('create')
    @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
    async createClinic(@Body() clinicData: CreateClinicDto): Promise<any> {
        this.logger.log('Received clinic creation request');
        const response = await this.clinicService.createClinic(clinicData);
        return response;
    }
}