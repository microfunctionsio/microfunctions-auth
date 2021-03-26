import { IsNotEmpty } from 'class-validator';
import { Profile } from './classes/profile';
import { ClientType } from '@microfunctions/common';


export interface IjwtPayload {
  email: string;
  id: string;
  provider?: string;
  profileId?: string;
  profiles?: Profile[];
  namespaces?: any[];
  typeClient?: ClientType;
}

export class IAccessToken {
  @IsNotEmpty()
  accessToken: string;
  idnamespaces?: string;
  idfunctions?: string;
  idcluster?: string;
}
