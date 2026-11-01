import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { LoginDto } from 'src/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @Post("login")
    async login(@Request() req, @Body() _loginData: LoginDto) {
      const data=await this.authService.login(req.user.id)
      return {data}
    }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(RefreshAuthGuard)
  @Post("refresh-token")
  async refreshToken(@Request()req){
    const data=await this.authService.refreshToken(req.user.id)
    return {data}
  }
}
