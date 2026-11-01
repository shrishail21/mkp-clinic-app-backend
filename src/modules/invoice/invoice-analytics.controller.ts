import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InvoiceAnalyticsService } from './invoice-analytics.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role } from 'src/schema/user.schema';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { InvoiceAnalyticsQueryDto } from 'src/dto/invoice-analytics-query.dto';
import { Throttle } from '@nestjs/throttler';

@UseGuards(JwtAuthGuard,RolesGuard)
@Roles([Role.ADMIN])
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('invoices/analytics')

export class InvoiceAnalyticsController {
  constructor(private readonly analyticsService: InvoiceAnalyticsService) {}

  /**
   * Get payment method breakdown for a specific clinic
   * Query: clinicId (required), period (today | month | year)
   * Returns: Revenue breakdown by payment method (card, UPI, cash)
   */
  @Get('payment-methods')
  async getPaymentMethodAnalysis(
    @Query() query: InvoiceAnalyticsQueryDto,
  ) {
    return this.analyticsService.getPaymentMethodAnalysis(query.clinicId, query.period);
  }

  /**
   * Get doctor performance metrics for a specific clinic
   * Query: clinicId (required), period (today | month | year)
   * Returns: Which doctor made how much revenue, profit, invoice count, etc.
   */
  @Get('doctor-performance')
  async getDoctorPerformance(
    @Query() query: InvoiceAnalyticsQueryDto,
  ) {
    return this.analyticsService.getDoctorPerformance(query.clinicId, query.period);
  }

  /**
   * Get financial summary for a specific clinic
   * Query: clinicId (required), period (today | month | year)
   * Returns: Total revenue, expense, profit, tax, and margin
   */
  @Get('financial-summary')
  async getFinancialSummary(
    @Query() query: InvoiceAnalyticsQueryDto,
  ) {
    return this.analyticsService.getFinancialSummary(query.clinicId, query.period);
  }

  /**
   * Get complete dashboard analytics for a specific clinic
   * Query: clinicId (required), period (today | month | year)
   * Returns: Combined view of all analytics data
   */
  @Get('dashboard')
  async getDashboardAnalytics(
    @Query() query: InvoiceAnalyticsQueryDto,
  ) {
    return this.analyticsService.getDashboardAnalytics(query.clinicId, query.period);
  }
}
