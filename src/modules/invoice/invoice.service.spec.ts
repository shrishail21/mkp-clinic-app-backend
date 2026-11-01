import { InvoiceService } from './invoice.service';
import { NotFoundException } from '@nestjs/common';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceModel: any;

  beforeEach(() => {
    invoiceModel = {
      countDocuments: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    service = new InvoiceService(invoiceModel, {} as any);
  });

  it('returns a 404-style pagination response when no invoices exist for the patient', async () => {
    const findQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    invoiceModel.countDocuments.mockResolvedValue(0);
    invoiceModel.find.mockReturnValue(findQuery);

    const result = await service.findByPatientWithPagination('507f191e810c19729de860ea');

    expect(result.status).toBe(404);
    expect(result.message).toBe('No invoices found for this patient');
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('throws a 404 when no latest invoice exists for the patient', async () => {
    const findOneQuery = {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    invoiceModel.findOne.mockReturnValue(findOneQuery);

    await expect(service.getLatestInvoiceByPatient('507f191e810c19729de860ea'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(findOneQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('soft deletes an invoice with a one-minute TTL', async () => {
    const query = {
      exec: jest.fn().mockResolvedValue({ _id: 'invoice-id', delete_status: true }),
    };
    invoiceModel.findOneAndUpdate.mockReturnValue(query);

    await service.remove('507f191e810c19729de860ea');

    const [filter, update, options] = invoiceModel.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({
      _id: expect.any(Object),
      delete_status: { $ne: true },
    });
    expect(update.$set.delete_status).toBe(true);
    expect(update.$set.expiresAt.getTime() - update.$set.deletedAt.getTime()).toBe(60_000);
    expect(options).toEqual({ new: true });
  });
});
