import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/modules/user/user.service';
import { LocalStrategy } from './strategy/local.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt-config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import refreshJwtConfig from './config/refresh-jwt-config';
import { RefreshJwtStrategy } from './strategy/refresh.strategy';

@Module({
  imports:[
    MongooseModule.forFeature([
        { name: 'User', schema: UserSchema } ,
      ]), 
    JwtModule.registerAsync(jwtConfig.asProvider()),
    JwtModule.registerAsync(refreshJwtConfig.asProvider()),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, refreshJwtConfig],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService,UserService,LocalStrategy,JwtStrategy,RefreshJwtStrategy],
})
export class AuthModule {}
