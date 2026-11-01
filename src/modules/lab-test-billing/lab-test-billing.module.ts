import { Module } from '@nestjs/common';
import { LabTestBillingService } from './lab-test-billing.service';
import { LabTestBillingController } from './lab-test-billing.controller';
import { LabTestBillingSchema } from 'src/schema/lab-test-billing.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([
        { name: 'LabTestBilling', schema: LabTestBillingSchema },
      ]),],
  controllers: [LabTestBillingController],
  providers: [LabTestBillingService],
  exports: [LabTestBillingService], 
})
export class LabTestBillingModule {}
