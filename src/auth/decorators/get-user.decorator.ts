import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

import { AuthRequest } from '../interfaces/auth-request.interface';
import { User } from '../entities/user.entity';

type UserProperties = keyof Pick<
  User,
  'id' | 'email' | 'password' | 'fullName' | 'isActive' | 'roles'
>;

export const GetUser = createParamDecorator(
  (data: UserProperties, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException('User not found in request');
    }

    if (data) return user[data];

    return user;
  },
);
