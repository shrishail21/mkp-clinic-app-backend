import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/modules/user/user.service';
import { AuthJwtPayload } from './type/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt-config';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private userService:UserService,private JwtService:JwtService, @Inject(refreshJwtConfig.KEY) private refreshJwtOptions: any){}
    async validateUser(email:string,password:string){
        const user=await this.userService.findUserByEmail(email)
        if(!user){
            this.logger.warn('Login attempt failed: user not found');
            throw new UnauthorizedException("User not found")
        }
        const isPasswordMatch=await compare(password,user.password)
        if(!isPasswordMatch){
            throw new UnauthorizedException("Invalid credential")
        }
        this.logger.log('User authenticated successfully');
        return{id:user._id,clinicId:user.clinicId,role:user.role};    
    }

    async login(userId:number){
        const payload:AuthJwtPayload={sub:userId}
        const token = this.JwtService.sign(payload)
        const refreshToken = this.JwtService.sign(payload, this.refreshJwtOptions);
        const user=await this.userService.findOne(userId)
        return {id:user?._id,clinicId:user?.clinicId,role:user?.role,doctorId:user?.doctorId,token:token,refreshToken:refreshToken}
    }

    async refreshToken(userId:number){
        const payload:AuthJwtPayload={sub:userId}
        const token = this.JwtService.sign(payload)
        const user=await this.userService.findOne(userId)
        return {token:token}
    }

    async validateJwtUser(userId:number){
        const user= await this.userService.findOne(userId)
        if(!user){
            throw new UnauthorizedException("user not found")
        }
        const currentUser={id:user._id,role:user.role,clinicId:user.clinicId}
        return currentUser
    }
}
