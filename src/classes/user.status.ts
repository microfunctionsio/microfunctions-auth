import { UserStatus as UserStatusEnum } from "@microfunctions/common";
import { Messages } from './messages';

export class UserStatus {
  status: UserStatusEnum;
  messages: Messages[];
}
