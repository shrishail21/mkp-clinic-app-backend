import { Injectable, Logger } from '@nestjs/common';
import { CreateLabTestBillingDto } from './dto/create-lab-test-billing.dto';
import { UpdateLabTestBillingDto } from './dto/update-lab-test-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class LabTestBillingService {
  private readonly logger = new Logger(LabTestBillingService.name);

  constructor(@InjectModel('LabTestBilling') private labTestBillingModel: any) {}
  
  create(createLabTestBillingDto: CreateLabTestBillingDto) {
    try {      
      const data = new this.labTestBillingModel(createLabTestBillingDto);
      return data.save();
    } catch (error) {
      this.logger.error('Error creating LabTestBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  findAll() {
    try {
      return this.labTestBillingModel.find().exec();
    } catch (error) {
      this.logger.error('Error finding LabTestBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  findOne(id: string) {
    try {
      const clinicId = new Types.ObjectId(id);
      return this.labTestBillingModel.find({ clinicId }).exec(); 
    } catch (error) {
      this.logger.error('Error finding LabTestBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  update(id: string, updateLabTestBillingDto: UpdateLabTestBillingDto) {
    try {
      const Id = new Types.ObjectId(id);
      return this.labTestBillingModel.findByIdAndUpdate(Id, updateLabTestBillingDto, { new: true }).exec();
    } catch (error) {
      this.logger.error('Error updating LabTestBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  remove(id: string) {
    try {
      const Id = new Types.ObjectId(id);
      return this.labTestBillingModel.findByIdAndDelete(Id).exec();
    } catch (error) {
      this.logger.error('Error removing LabTestBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
