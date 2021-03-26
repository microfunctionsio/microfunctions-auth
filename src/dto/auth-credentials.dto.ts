import {Matches, MaxLength, MinLength,} from 'class-validator';
import {Profile} from '../classes/profile';
import {ClientType} from "@microfunctions/common";


export class AuthCredentialsDto {

  email: string;
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[a-zA-Z1-9]\w{8,14}$/, {
    message: 'Password is too short (minimum is 8 characters) and is in a list of passwords commonly used on other websites',
  })
  password: string;
  profile: Profile;
  typeClient: ClientType;
}
