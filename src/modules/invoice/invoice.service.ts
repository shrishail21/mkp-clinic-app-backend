import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectModel('Invoice') private invoiceModel: any,
    @InjectModel('MedicinesBilling') private medicinesBillingModel: any,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    try {
      // Create the invoice
      const invoice = new this.invoiceModel(createInvoiceDto);
      const savedInvoice = await invoice.save();

      // Process each item - if it's a medicine, reduce its quantity
      for (const item of createInvoiceDto.items) {
        if (item.type === 'medicine' && item.quantity) {
          try {
            const medicineId = new Types.ObjectId(item.itemId);
            await this.medicinesBillingModel
              .findByIdAndUpdate(
                medicineId,
                { $inc: { quantity: -item.quantity } },
                { new: true },
              )
              .exec();
          } catch (error) {
            this.logger.error(
              `Error updating medicine quantity for ${item.itemId}`,
              error instanceof Error ? error.stack : String(error),
            );
            // Continue processing other items even if one fails
          }
        }
      }

      return savedInvoice;
    } catch (error) {
      this.logger.error(
        'Error creating Invoice',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findAllWithPagination(page: number = 1, limit: number = 3) {
    try {
      const skip = (page - 1) * limit;
      const filter = { delete_status: { $ne: true } };
      const total = await this.invoiceModel.countDocuments(filter).exec();
      const invoices = await this.invoiceModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        'Error finding Invoices with pagination',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  findOne(id: string) {
    try {
      const invoiceId = new Types.ObjectId(id);
      return this.invoiceModel
        .findOne({
          _id: invoiceId,
          delete_status: { $ne: true },
        })
        .exec();
    } catch (error) {
      this.logger.error(
        'Error finding Invoice',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findByClinicWithPagination(
    clinicId: string,
    page: number = 1,
    limit: number = 3,
  ) {
    try {
      const cId = new Types.ObjectId(clinicId);
      const skip = (page - 1) * limit;
      const filter = { clinicId: cId, delete_status: { $ne: true } };
      const total = await this.invoiceModel.countDocuments(filter).exec();
      const invoices = await this.invoiceModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        'Error finding Invoices by clinic with pagination',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findByPatientWithPagination(
    patientId: string,
    page: number = 1,
    limit: number = 3,
  ) {
    try {
      const safePage = Math.max(1, page);
      const safeLimit = Math.min(3, Math.max(1, limit));
      const skip = (safePage - 1) * safeLimit;
      const pId = new Types.ObjectId(patientId);
      const filter = { patientId: pId, delete_status: { $ne: true } };

      const [data, total] = await Promise.all([
        this.invoiceModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .exec(),
        this.invoiceModel.countDocuments(filter),
      ]);

      if (data.length === 0) {
        return {
          status: 404,
          message: 'No invoices found for this patient',
          data: [],
          error: null,
          pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
          },
        };
      }

      return {
        status: 200,
        message: 'Invoices retrieved successfully',
        data,
        error: null,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      };
    } catch (error) {
      this.logger.error(
        'Error finding Invoices by patient with pagination',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    try {
      const invoiceId = new Types.ObjectId(id);
      return this.invoiceModel
        .findOneAndUpdate(
          { _id: invoiceId, delete_status: { $ne: true } },
          updateInvoiceDto,
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        'Error updating Invoice',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  remove(id: string) {
    try {
      const invoiceId = new Types.ObjectId(id);
      const deletedAt = new Date();
      const expiresAt = new Date(deletedAt.getTime() + 60_000);
      return this.invoiceModel
        .findOneAndUpdate(
          { _id: invoiceId, delete_status: { $ne: true } },
          { $set: { delete_status: true, deletedAt, expiresAt } },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        'Error removing Invoice',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getLatestInvoiceByPatient(patientId: string) {
    const pId = new Types.ObjectId(patientId);
    const invoice = await this.invoiceModel
      .findOne({ patientId: pId, delete_status: { $ne: true } })
      .sort({ createdAt: -1 })
      .exec();

    if (!invoice) {
      throw new NotFoundException('No invoice found for this patient');
    }

    return invoice;
  }
}
