import { createParamDecorator } from '@nestjs/common';
import { User } from '../entitys/user';

export const GetUser = createParamDecorator(
  (data, req): User => {
    return req.user;
  },
);
