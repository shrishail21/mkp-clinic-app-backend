import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceSchema } from 'src/schema/invoice.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicinesBillingSchema } from 'src/schema/medicines-billing.schema';
import { InvoiceAnalyticsService } from './invoice-analytics.service';
import { InvoiceAnalyticsController } from './invoice-analytics.controller';
import { UserSchema } from 'src/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'MedicinesBilling', schema: MedicinesBillingSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [InvoiceController, InvoiceAnalyticsController],
  providers: [InvoiceService, InvoiceAnalyticsService],
  exports: [InvoiceService, InvoiceAnalyticsService],
})
export class InvoiceModule {}
