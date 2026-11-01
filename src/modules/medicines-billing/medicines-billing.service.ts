import { Injectable, Logger } from '@nestjs/common';
import { CreateMedicinesBillingDto } from './dto/create-medicines-billing.dto';
import { UpdateMedicinesBillingDto } from './dto/update-medicines-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class MedicinesBillingService {
  private readonly logger = new Logger(MedicinesBillingService.name);

  constructor(@InjectModel('MedicinesBilling') private medicinesBillingModel: any) {}
  
  create(createMedicinesBillingDto: CreateMedicinesBillingDto) {
    try {      
      const data = new this.medicinesBillingModel(createMedicinesBillingDto);
      return data.save();
    } catch (error) {
      this.logger.error('Error creating MedicinesBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  findAll() {
    try {
      return this.medicinesBillingModel.find().exec();
    } catch (error) {
      this.logger.error('Error finding MedicinesBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  findOne(id: string) {
    try {
      const clinicId = new Types.ObjectId(id);
      return this.medicinesBillingModel.find({ clinicId }).exec(); 
    } catch (error) {
      this.logger.error('Error finding MedicinesBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  update(id: string, updateMedicinesBillingDto: UpdateMedicinesBillingDto) {
    try {
      const medicineId = new Types.ObjectId(id);
      return this.medicinesBillingModel.findByIdAndUpdate(medicineId, updateMedicinesBillingDto, { new: true }).exec();
    } catch (error) {
      this.logger.error('Error updating MedicinesBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  remove(id: string) {
    try {
      const medicineId = new Types.ObjectId(id);
      return this.medicinesBillingModel.findByIdAndDelete(medicineId).exec();
    } catch (error) {
      this.logger.error('Error removing MedicinesBilling', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
