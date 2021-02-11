import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IjwtPayload } from './IjwtPayload';
import { User } from './entitys/user';
import { AuthService } from './auth.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }
  public validate(payload: IjwtPayload): Promise<User> {
    const { email } = payload;
    return this.authService.validateUser(email).toPromise();
  }
}
