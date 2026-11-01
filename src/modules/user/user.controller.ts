import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { CreateReceptionistDto } from 'src/dto/create-receptionist.dto';
import { CreateDoctorDto } from 'src/dto/create-doctor.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import { UpdatePasswordDto } from 'src/dto/update-password.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';
import { Throttle } from '@nestjs/throttler';

type AuthenticatedRequest = {
  user: { id: string; role: Role; clinicId: string };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}
  private ensureSelfOrAdmin(id: string, request: AuthenticatedRequest): void {
    if (String(request.user.id) !== id && request.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only access your own user record');
    }
  }

  @Post('create')
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  async createUser(@Body() userData: CreateUserDto): Promise<any> {
    const data = await this.userService.createUser(userData);
    this.logger.log('User creation request completed');

    return data;
  }

  @Post('addReceptionist')
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  async addReceptionist(
    @Body() receptionistData: CreateReceptionistDto,
  ): Promise<any> {
    const data = await this.userService.addReceptionist(receptionistData);
    this.logger.log('Receptionist creation request completed');
    return data;
  }
  @Post('receptionists')
  @Roles([Role.ADMIN, Role.DOCTOR])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getReceptionists(@Req() request: AuthenticatedRequest): Promise<any> {
    this.logger.log('Fetching receptionists');
    const data = await this.userService.getReceptionistsByClinicId(
      request.user.clinicId,
    );
    return data;
  }

  @Post('addDoctor')
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  async addDoctor(@Body() body: CreateDoctorDto): Promise<any> {
    const data = await this.userService.addDoctor(body);
    return data;
  }

  @Get('doctors/:id')
  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getDoctorByClinicId(@Param('id') id: string): Promise<any> {
    this.logger.log('Fetching doctor by clinic');
    const data = await this.userService.getDoctorByClinicId(id);
    return data;
  }

  @Get('allDoctors/:id')
  @Roles([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST])
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getAllDoctors(@Param('id') id: string): Promise<any> {
    this.logger.log('Fetching doctors by clinic');
    const data = await this.userService.getAllDoctors(id);
    return data;
  }

  @Delete('delete/:id')
  @Roles([Role.ADMIN])
  async deleteUser(@Param('id') id: string): Promise<any> {
    const data = await this.userService.deleteUser(id);
    return data;
  }
  @Get('/:id')
  async getUserById(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<any> {
    this.ensureSelfOrAdmin(id, request);
    const data = await this.userService.getUserById(id);
    return data;
  }
  @Get('/profile/:id')
  async getProfile(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<any> {
    this.ensureSelfOrAdmin(id, request);
    const data = await this.userService.getProfile(id);
    return data;
  }

  @Put('/:id')
  @Roles([Role.ADMIN])
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<any> {
    const data = await this.userService.updateUser(id, updateData);
    return data;
  }

  @Put('/password/:id')
  async updatePassword(
    @Param('id') id: string,
    @Body() passwordData: UpdatePasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<any> {
    this.ensureSelfOrAdmin(id, request);
    this.logger.log('Password update request received');
    const data = await this.userService.updatePassword(id, passwordData);
    return data;
  }
}
