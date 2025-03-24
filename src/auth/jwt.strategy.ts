import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from './jwt.config';
import { AuthJwtPayload } from 'src/models/auth.model';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) private configService: ConfigType<typeof jwtConfig>,
    private userService: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.secret,
    });
  }

  async validate(payload: AuthJwtPayload) {
    const username = payload.sub;
    const key = `user_${username}`;
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }

    const user = await this.userService.findUserByUsername(username);
    if (!user) {
      throw new HttpException('Unauthorized', 401);
    }
    const data = {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
    };
    await this.cacheManager.set(key, data);

    return data;
  }
}
