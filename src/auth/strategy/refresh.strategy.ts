
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt-config';
import { AuthService } from '../auth.service';
import refreshJwtConfig from '../config/refresh-jwt-config';


@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy,"refresh-jwt") {
  constructor(@Inject(refreshJwtConfig.KEY) private RefreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,private authService:AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: RefreshJwtConfiguration.secret || '4affe2f7205b8392286c251238142e7d3c3cd967fe36830068df2a728e2ef2d6',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const userId=payload.sub    
    return this.authService.validateJwtUser(userId);
  }
}
