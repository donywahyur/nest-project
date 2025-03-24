import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from 'src/models/user.model';
import { ApiResponse } from 'src/models/api.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('/api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async register(
    @Body() request: RegisterUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    const response: UserResponse = await this.userService.register(request);

    return {
      success: true,
      data: response,
    };
  }

  @Post('/login')
  async login(
    @Body() request: LoginUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userService.login(request);

    return {
      success: true,
      data: response,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/current')
  async current(@Req() req): Promise<ApiResponse<UserResponse>> {
    return {
      success: true,
      data: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(
    @Req() req,
    @Body() request: UpdateUserRequest,
  ): Promise<ApiResponse<UserResponse>> {
    const user = await this.userService.update(req.user.username, request);

    return {
      success: true,
      data: user,
    };
  }
}
