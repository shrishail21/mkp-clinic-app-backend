import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { toTitleCase } from 'src/shared/functions/commonFunctions';

@Injectable()
export class ClinicService {
  private readonly logger = new Logger(ClinicService.name);

  constructor(@InjectModel('Clinic') private clinicModel: Model<any>,
@InjectModel('User') private userModel: Model<any>) {
  }
  async createClinic(clinicData) {
    try {

      const existingClinic = await this.clinicModel.findOne({
        name: clinicData.name,
        phoneNumber: clinicData.phoneNumber,
        delete_status: false,
      });
      if (existingClinic) {
        throw new HttpException(
          'Clinic with this name already exists',
          HttpStatus.CONFLICT,
        );
      }


      const newClinic = new this.clinicModel(clinicData);
      const savedClinic = await newClinic.save();
      this.logger.log(`Clinic created successfully: ${savedClinic._id}`);

      const hashedPassword = await bcrypt.hash(clinicData.password, 10);
      const newUser = new this.userModel({
        name: toTitleCase(clinicData.adminName) || " Admin",
        email: clinicData.email, 
        password: hashedPassword,
        phoneNumber: clinicData.phoneNumber,
        role: 'Admin',
        clinicId: savedClinic._id,
      });
      const savedUser = await newUser.save();
      this.logger.log(`Clinic admin user created successfully: ${savedUser._id}`);

      return {
        message: 'Clinic and admin user created successfully',
        clinic: savedClinic,
        user: savedUser,
      };

    } catch (error) {
      this.logger.error(
        'Error creating clinic',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        'Failed to create clinic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
