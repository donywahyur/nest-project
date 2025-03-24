import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from 'src/models/auth.model';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async createToken(username: string): Promise<string> {
    const payload: AuthJwtPayload = {
      sub: username,
    };
    return this.jwtService.sign(payload);
  }
}
