import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class InvoiceAnalyticsService {
  private readonly logger = new Logger(InvoiceAnalyticsService.name);

  constructor(
    @InjectModel('Invoice') private invoiceModel: any,
    @InjectModel('User') private userModel: any,
  ) {}

  /**
   * ============================================
   * HELPER FUNCTIONS - Date Range Filters
   * ============================================
   */

  // Get date range based on period type - returns consistent startDate and endDate
  private getDateRangeByPeriod(period: 'today' | 'month' | 'year') {
    let startDate: Date;
    let endDate: Date;

    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * ============================================
   * PAYMENT METHOD ANALYSIS
   * ============================================
   */

  async getPaymentMethodAnalysis(
    clinicId: string,
    period: 'today' | 'month' | 'year' = 'today',
  ) {
    try {
      const { startDate, endDate } = this.getDateRangeByPeriod(period);
      const cId = new Types.ObjectId(clinicId);

      const paymentAnalysis = await this.invoiceModel.aggregate([
        {
          $match: {
            clinicId: cId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'draft' }, // Exclude draft invoices
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$totalAmount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
      ]);

      // Format response
      const formattedData = paymentAnalysis.map((method) => ({
        paymentMethod: method._id || 'Unknown',
        totalAmount: Math.round(method.totalAmount * 100) / 100,
        count: method.count,
        avgAmount: Math.round(method.avgAmount * 100) / 100,
      }));

      const totalRevenue = formattedData.reduce((sum, item) => sum + item.totalAmount, 0);

      return {
        period,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paymentMethods: formattedData,
      };
    } catch (error) {
      this.logger.error('Error in getPaymentMethodAnalysis', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * ============================================
   * DOCTOR PERFORMANCE ANALYSIS
   * ============================================
   */

  async getDoctorPerformance(
    clinicId: string,
    period: 'today' | 'month' | 'year' = 'today',
  ) {
    try {
      const { startDate, endDate } = this.getDateRangeByPeriod(period);
      const cId = new Types.ObjectId(clinicId);

      const doctorStats = await this.invoiceModel.aggregate([
        {
          $match: {
            clinicId: cId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'draft' },
          },
        },
        {
          $group: {
            _id: '$doctorId',
            invoiceCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalExpense: { $sum: '$actualCostTotal' },
            totalProfit: { $sum: '$profit' },
            avgInvoiceAmount: { $avg: '$totalAmount' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'doctorInfo',
          },
        },
        {
          $unwind: {
            path: '$doctorInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
      ]);

      // Format response
      const formattedData = doctorStats.map((doctor) => ({
        doctorId: doctor._id,
        doctorName: doctor.doctorInfo?.name || 'Unknown',
        invoiceCount: doctor.invoiceCount,
        totalRevenue: Math.round(doctor.totalRevenue * 100) / 100,
        totalExpense: Math.round(doctor.totalExpense * 100) / 100,
        totalProfit: Math.round(doctor.totalProfit * 100) / 100,
        avgInvoiceAmount: Math.round(doctor.avgInvoiceAmount * 100) / 100,
        profitMargin: doctor.totalRevenue > 0 
          ? Math.round((doctor.totalProfit / doctor.totalRevenue) * 100 * 100) / 100 
          : 0,
      }));

      return {
        period,
        totalDoctors: formattedData.length,
        doctors: formattedData,
      };
    } catch (error) {
      this.logger.error('Error in getDoctorPerformance', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * ============================================
   * FINANCIAL SUMMARY ANALYSIS
   * ============================================
   */

  async getFinancialSummary(
    clinicId: string,
    period: 'today' | 'month' | 'year' = 'today',
  ) {
    try {
      const { startDate, endDate } = this.getDateRangeByPeriod(period);
      const cId = new Types.ObjectId(clinicId);

      const summary = await this.invoiceModel.aggregate([
        {
          $match: {
            clinicId: cId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'draft' },
          },
        },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalExpense: { $sum: '$actualCostTotal' },
            totalProfit: { $sum: '$profit' },
            totalTax: { $sum: '$taxAmount' },
            avgInvoiceAmount: { $avg: '$totalAmount' },
          },
        },
      ]);

      if (!summary || summary.length === 0) {
        return {
          period,
          totalInvoices: 0,
          totalRevenue: 0,
          totalExpense: 0,
          totalProfit: 0,
          totalTax: 0,
          avgInvoiceAmount: 0,
          profitMargin: 0,
        };
      }

      const data = summary[0];
      const profitMargin = data.totalRevenue > 0 
        ? Math.round((data.totalProfit / data.totalRevenue) * 100 * 100) / 100 
        : 0;

      return {
        period,
        totalInvoices: data.totalInvoices,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalExpense: Math.round(data.totalExpense * 100) / 100,
        totalProfit: Math.round(data.totalProfit * 100) / 100,
        totalTax: Math.round(data.totalTax * 100) / 100,
        avgInvoiceAmount: Math.round(data.avgInvoiceAmount * 100) / 100,
        profitMargin,
      };
    } catch (error) {
      this.logger.error('Error in getFinancialSummary', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * ============================================
   * COMBINED DASHBOARD ANALYTICS
   * ============================================
   */

  async getDashboardAnalytics(
    clinicId: string,
    period: 'today' | 'month' | 'year' = 'today',
  ) {
    try {
      const [paymentAnalysis, doctorPerformance, financialSummary] = await Promise.all([
        this.getPaymentMethodAnalysis(clinicId, period),
        this.getDoctorPerformance(clinicId, period),
        this.getFinancialSummary(clinicId, period),
      ]);

      return {
        period,
        timestamp: new Date(),
        financialSummary,
        paymentAnalysis,
        doctorPerformance,
      };
    } catch (error) {
      this.logger.error('Error in getDashboardAnalytics', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
