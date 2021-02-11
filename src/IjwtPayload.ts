import { IsNotEmpty } from 'class-validator';
import { Profile } from './classes/profile';
import { TypeClientEnums } from './enums/typeClient.enums';

export interface IjwtPayload {
  email: string;
  id: string;
  provider?: string;
  profileId?: string;
  profiles?: Profile[];
  namespaces?: any[];
  typeClient?: TypeClientEnums;
}

export class IAccessToken {
  @IsNotEmpty()
  accessToken: string;
  idnamespaces?: string;
  idfunctions?: string;
  idcluster?: string;
}
