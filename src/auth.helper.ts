import { UserStatus } from './classes/user.status';
import { StatusUser } from './enums/status.user.enum';
import { v4 as uuid } from 'uuid';
export class AuthHelper {
  static MESSAGE_EMAIL = 'validé votre email';

  static getDefaultMessage(): UserStatus {
    const userStatus: UserStatus = {
      status: StatusUser.ENABLED,
      messages: [{ message: AuthHelper.MESSAGE_EMAIL, createdAt: new Date() }],
    };

    return userStatus;
  }

  static getEnabledMessage(): UserStatus {
    const userStatus: UserStatus = {
      status: StatusUser.ENABLED,
      messages: [{ message: '', createdAt: new Date() }],
    };

    return userStatus;
  }

  static generateCliKey(): string{
    const apiKey: string = uuid();
    return apiKey;
  }
}


