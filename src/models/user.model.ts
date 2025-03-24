import { User } from '@prisma/client';

export class RegisterUserRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
}

export class LoginUserRequest {
  username: string;
  password: string;
}

export class UpdateUserRequest {
  password?: string;
  name?: string;
  phone?: string;
}

export class UserResponse {
  username: string;
  name: string;
  phone: string;
  token?: string;
}

export function formatUserResponse(user: User): UserResponse {
  return {
    username: user.username,
    name: user.name,
    phone: user.phone,
  };
}
