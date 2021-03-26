import { UserStatus } from './classes/user.status';
import { UserStatus as UserStatusEnum } from "@microfunctions/common";
import { v4 as uuid } from 'uuid';
export class AuthHelper {
  static MESSAGE_EMAIL = 'validé votre email';

  static getDefaultMessage(): UserStatus {
    const userStatus: UserStatus = {
      status: UserStatusEnum.ENABLED,
      messages: [{ message: AuthHelper.MESSAGE_EMAIL, createdAt: new Date() }],
    };

    return userStatus;
  }

  static getEnabledMessage(): UserStatus {
    const userStatus: UserStatus = {
      status: UserStatusEnum.ENABLED,
      messages: [{ message: '', createdAt: new Date() }],
    };

    return userStatus;
  }

  static generateCliKey(): string{
    const apiKey: string = uuid();
    return apiKey;
  }
}


