import { StatusUser } from '../enums/status.user.enum';
import { Messages } from './messages';

export class UserStatus {
  status: StatusUser;
  messages: Messages[];
}
