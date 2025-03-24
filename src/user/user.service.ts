import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  formatUserResponse,
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from 'src/models/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import { compareSync, hashSync } from 'bcrypt';
import { AXIOS_INSTANCE_TOKEN } from 'src/common/axios.provider';
import { AxiosInstance } from 'axios';
import { User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    @Inject(AXIOS_INSTANCE_TOKEN) private axios: AxiosInstance,
    private prismaService: PrismaService,
    private authService: AuthService,
  ) {}

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
    });

    return user;
  }
  async register(request: RegisterUserRequest): Promise<UserResponse> {
    this.logger.info(`UserService.register(${JSON.stringify(request)})`);

    const registerRequest = this.validationService.validate(
      UserValidation.REGISTER,
      request,
    );

    const userExist = await this.findUserByUsername(registerRequest.username);

    if (userExist) {
      throw new HttpException('Username already exists', 400);
    }

    const response = await this.axios.post('/users', registerRequest);

    delete response.data.id;
    const apiResponse: RegisterUserRequest = response.data;
    this.logger.info(`Response from api ${JSON.stringify(apiResponse)}`);

    apiResponse.password = hashSync(apiResponse.password, 10);

    const user = await this.prismaService.user.create({
      data: apiResponse,
    });
    this.logger.error(user);

    return formatUserResponse(user);
  }

  async login(request: LoginUserRequest): Promise<UserResponse> {
    this.logger.info(`UserService.login(${JSON.stringify(request)})`);
    const loginRequest = this.validationService.validate(
      UserValidation.LOGIN,
      request,
    );

    await this.axios.get(`users?username=${loginRequest.username}`);

    const user = await this.findUserByUsername(loginRequest.username);
    if (!user) {
      throw new HttpException('Username / password invalid', 404);
    }

    const isPasswordValid = compareSync(loginRequest.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Username / password invalid', 404);
    }

    const formattedUser = formatUserResponse(user);
    const token = await this.authService.createToken(formattedUser.username);
    formattedUser.token = token;

    return formattedUser;
  }

  async update(
    username: string,
    request: UpdateUserRequest,
  ): Promise<UserResponse> {
    this.logger.info(`UserService.update(${JSON.stringify(request)})`);
    const updateRequest = this.validationService.validate(
      UserValidation.UPDATE,
      request,
    );

    const user = await this.findUserByUsername(username);
    if (!user) {
      throw new HttpException('Username / password invalid', 404);
    }

    const response = await this.axios.patch(`/users/${user.id}`, updateRequest);
    if (updateRequest.password) {
      user.password = hashSync(response.data.password, 10);
    }
    if (updateRequest.name) {
      user.name = response.data.name;
    }
    if (updateRequest.phone) {
      user.phone = response.data.phone;
    }

    const userUpdate = await this.prismaService.user.update({
      where: {
        username: username,
      },
      data: user,
    });

    return formatUserResponse(userUpdate);
  }
}
