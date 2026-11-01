import { Module } from '@nestjs/common';
import { ServicesBillingService } from './services-billing.service';
import { ServicesBillingController } from './services-billing.controller';
import { ServicesBillingSchema } from 'src/schema/servicesBilling.schem';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([
        { name: 'ServicesBilling', schema: ServicesBillingSchema },
      ]),],
  controllers: [ServicesBillingController],
  providers: [ServicesBillingService],
  exports: [ServicesBillingService], 
})
export class ServicesBillingModule {}
