import { Injectable, Logger } from '@nestjs/common';
import { CreateServicesBillingDto } from './dto/create-services-billing.dto';
import { UpdateServicesBillingDto } from './dto/update-services-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class ServicesBillingService {
  private readonly logger = new Logger(ServicesBillingService.name);

  constructor(@InjectModel('ServicesBilling') private servicesBillingModel: any) {}
  create(createServicesBillingDto: CreateServicesBillingDto) {
    try {      
      const data = new this.servicesBillingModel(createServicesBillingDto);
      return data.save();
    } catch (error) {
      this.logger.error('Error creating ServicesBilling', error instanceof Error ? error.stack : String(error));
      throw error; // rethrow or handle as needed
    }
  }

  findAll() {
    return `This action returns all servicesBilling`;
  }

  findOne(id: string) {
    const clinicId = new Types.ObjectId(id);
    return this.servicesBillingModel.find({ clinicId }).exec(); 
  }

  update(id: string, updateServicesBillingDto: UpdateServicesBillingDto) {
    const serviceId = new Types.ObjectId(id);
    return this.servicesBillingModel.findByIdAndUpdate({ _id: serviceId }, updateServicesBillingDto, { new: true }).exec();
  }

  remove(id: string) {
    const serviceId = new Types.ObjectId(id);
    return this.servicesBillingModel.findByIdAndDelete({ _id: serviceId }).exec();
  }
}
