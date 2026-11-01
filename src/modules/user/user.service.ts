import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, Role } from 'src/schema/user.schema';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { CreateReceptionistDto } from 'src/dto/create-receptionist.dto';
import { CreateDoctorDto } from 'src/dto/create-doctor.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import { UpdatePasswordDto } from 'src/dto/update-password.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel('User') private userModel: Model<User>) {}
  async createUser(userData: CreateUserDto) {
    const checkEmailIsPresent = await this.findUserByEmail(userData.email);
    if (checkEmailIsPresent) {
      return {
        status: 409,
        message: 'Email already exists',
        error: ' Email already in use',
      };
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user object
    const data = { ...userData, password: hashedPassword };

    // Save user
    const response = await this.userModel.create(data);
    if (!response) {
      return {
        status: 400,
        message: 'User creation failed',
        error: 'Failed to create user',
      };
    }
    return { message: 'User created successfully', status: 201, error: null };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findOne({
      _id: id,
    });
    return {
      name: user?.name,
      email: user?.email,
      role: user?.role,
      joinedAt: user?.createdAt,
      phoneNumber: user?.phoneNumber,
    };
  }

  async findUserByEmail(email: string) {
    const user = await this.userModel.findOne({
      email: email,
    });
    return user;
  }

  async findOne(userId: number) {
    const user = await this.userModel.findOne({
      _id: userId,
    });
    return user;
  }

  async getProfile(id: string) {
    const userId = new Types.ObjectId(id);
    const user = await this.userModel
      .findById(userId)
      .populate('clinicId', 'name address phoneNumber email')
      .select('-password')
      .exec();
    return user;
  }

  async addDoctor(doctorData: CreateDoctorDto) {
    const existingUser = await this.userModel.findOne({
      email: doctorData.email,
    });
    if (existingUser) {
      return {
        status: 409,
        message: 'Email already exists',
        error: 'Email already in use',
      };
    }

    const hashedPassword = await bcrypt.hash(doctorData.password, 10);
    const data = {
      ...doctorData,
      password: hashedPassword,
      role: Role.DOCTOR,
    };

    const newDoctor = new this.userModel(data);
    const saved = await newDoctor.save();
    return {
      message: 'Doctor created successfully',
      status: 201,
      error: null,
      doctorId: saved._id,
    };
  }

  async addReceptionist(receptionistData: CreateReceptionistDto) {
    const checkEmailIsPresent = await this.userModel.findOne({
      email: receptionistData.email,
      clinicId: receptionistData.clinicId,
    });
    if (checkEmailIsPresent) {
      return {
        status: 409,
        message: 'Email already exists',
        error: ' Email already in use',
      };
    }
    const hashedPassword = await bcrypt.hash(receptionistData.password, 10);
    const data = { ...receptionistData, password: hashedPassword };
    const newReceptionist = new this.userModel(data);
    return newReceptionist.save();
  }

  async getReceptionistsByClinicId(clinicId: string) {
    if (!Types.ObjectId.isValid(clinicId)) return [];
    return this.userModel
      .find({
        role: Role.RECEPTIONIST,
        clinicId: new Types.ObjectId(clinicId),
      })
      .select('-password')
      .exec();
  }

  async getDoctorByClinicId(id: string) {
    const clinicId = new Types.ObjectId(id);
    return this.userModel
      .find({ role: { $in: [Role.DOCTOR, Role.ADMIN] }, clinicId: clinicId })
      .exec();
  }

  deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .exec();
      return updatedUser;
    } catch (error) {
      this.logger.error(
        'Error updating user',
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error('User update failed');
    }
  }

  async updatePassword(id: string, passwordData: UpdatePasswordDto) {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        return {
          status: 404,
          message: 'User not found',
          error: 'No user with the provided ID',
        };
      }
      const isPasswordMatch = await bcrypt.compare(
        passwordData.currentPassword,
        user.password,
      );
      if (!isPasswordMatch) {
        return {
          status: 400,
          message: 'Current password is incorrect',
          error: 'Incorrect current password',
        };
      }
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: { password: hashedNewPassword } },
          { new: true },
        )
        .exec();
      return {
        status: 200,
        message: 'Password updated successfully',
        error: null,
        updatedUser,
      };
    } catch (error) {
      this.logger.error(
        'Error updating password',
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error('Password update failed');
    }
  }

  getAllDoctors(id: string) {
    const clinicId = new Types.ObjectId(id);
    return this.userModel
      .find({ role: { $in: ['Doctor', 'Admin'] }, clinicId: clinicId })
      .exec();
  }
}
