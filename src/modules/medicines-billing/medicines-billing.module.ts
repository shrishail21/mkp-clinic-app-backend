import { Module } from '@nestjs/common';
import { MedicinesBillingService } from './medicines-billing.service';
import { MedicinesBillingController } from './medicines-billing.controller';
import { MedicinesBillingSchema } from 'src/schema/medicines-billing.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([
        { name: 'MedicinesBilling', schema: MedicinesBillingSchema },
      ]),],
  controllers: [MedicinesBillingController],
  providers: [MedicinesBillingService],
  exports: [MedicinesBillingService], 
})
export class MedicinesBillingModule {}
