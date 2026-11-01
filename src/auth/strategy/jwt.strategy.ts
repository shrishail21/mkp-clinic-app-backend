
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt-config';
import { AuthService } from '../auth.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(jwtConfig.KEY) private JwtConfiguration: ConfigType<typeof jwtConfig>,private authService:AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JwtConfiguration.secret || '4affe2f7205b8392286c251238142e7d3c3cd967fe36830068df2a728e2ef2d6',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const userId=payload.sub    
    return this.authService.validateJwtUser(userId);
  }
}
