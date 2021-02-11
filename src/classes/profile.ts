export enum Provider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

export class Profile {
  id: string;
  provider: Provider;
  accessToken: string;
  login: string;
}
