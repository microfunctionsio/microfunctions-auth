import {
    ConflictException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';

import {User, UserDocument} from './entitys/user';
import {AuthCredentialsDto} from './dto/auth-credentials.dto';
import {from, Observable, of} from 'rxjs';
import {catchError, map, mergeMap, tap, toArray} from 'rxjs/operators';
import * as bcrypt from 'bcryptjs';
import {JwtService} from '@nestjs/jwt';
import {IAccessToken, IjwtPayload} from './IjwtPayload';
import {AuthHelper} from './auth.helper';
import * as generate from 'generate-password';
import {Profile} from './classes/profile';
import {Cli, CliDocument, Key} from './entitys/cli';
import {plainToClass} from 'class-transformer';
import {ConfigService} from '@nestjs/config';
import {isEmpty} from 'class-validator';
import {Connection, Model} from "mongoose";
import {InjectConnection, InjectModel} from "@nestjs/mongoose";
import {MicroFunctionException} from "./errors/micro.function.Exception";
import {MessagesError} from "./messages";
import {ClientType, IResponse} from "@microfunctions/common";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Cli.name) private cliModel: Model<CliDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {

  }

  public signUp(authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;

    const user = new User();
    user.email = email;
    user.typeClient =  authCredentialsDto.typeClient || ClientType.Developer;
    const salt$ = from(bcrypt.genSalt()).pipe(
      tap((salt: string) => {
        user.salt = salt;
      }),
    );

    return salt$.pipe(
      mergeMap((salt: string) => {
        return this.hashPassword(password, salt);
      }),
      map((password$: string) => {
        user.password = password$;
        user.status = AuthHelper.getDefaultMessage();
        const createdUser = new this.userModel(user);
        return createdUser;
      }),
      mergeMap((createdUser: any) => {
        return from(createdUser.save()).pipe(
          catchError(error => {
            if (error.code === 11000) {
              // duplicate username
                const response: IResponse = {
                    status: HttpStatus.CONFLICT,
                    message: MessagesError.collaboratorsAlreadyExists,
                };
                throw new MicroFunctionException(response);
            } else {
              console.error(error);
              throw new MicroFunctionException(error);
            }
          }),
        );
      }),
      mergeMap(() => {
        return this.validateUserPassword(authCredentialsDto);
      }),
    );
  }

  public signIn(authCredentialsDto: AuthCredentialsDto): Observable<IAccessToken> {
    return this.validateUserPassword(authCredentialsDto);
  }

  private validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Observable<IAccessToken> {
    const { email, password } = authCredentialsDto;
    return from(this.userModel.findOne({ email })).pipe(
      mergeMap((user: User) => {
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
        return from(bcrypt.hash(password, user.salt)).pipe(
          map((hash: string) => hash === user.password),
          mergeMap((isValidePassword: boolean) => {
            if (!isValidePassword) {
              throw new UnauthorizedException('Invalid credentials');
            }
            const jwtPayload = {
              email: user.email,
              id: user.id.toString(),
              profiles: user.profiles,
              typeClient: user.typeClient,
            };
            return from(this.jwtService.signAsync(jwtPayload)).pipe(
              map((accessToken: string) => {
                return { accessToken };
              }),
            );
          }),
        );
      }),
      map((accessToken: IAccessToken) => {
        return accessToken;
      }),
    );
  }

  public validateProfile(profile: any): Observable<IAccessToken> {
    const email = profile.email;

    return from(this.userModel.findOne({ email })).pipe(
      mergeMap((user: User) => {
        if (!user) {
          const authCredentialsDto: AuthCredentialsDto = new AuthCredentialsDto();
          authCredentialsDto.email = email;
          authCredentialsDto.profile = profile;
          authCredentialsDto.typeClient = ClientType.Developer;
          authCredentialsDto.password = generate.generate({
            length: 10,
            numbers: true,
          });
          return this.signProvider(authCredentialsDto);
        } else {
          return this.addProfile(user, profile);
        }
      }),
      map((accessToken: IAccessToken) => {
        return accessToken;
      }),
    );
  }

  public validateUser(email: string): Observable<any> {
    return from(this.userModel.findOne({ email })).pipe(
      map((user: User) => {
        if (!user) {
          return null;
        }
        return user;
      }),
    );
  }

  public listCollaborators(user: User): Observable<any> {
    return from(this.userModel.find({})).pipe(
        mergeMap((users: User[]) => from(users)),
        map((users: User)=>{
            users.canChangePassword = false;
            users.canDelete = false ;
            return users;
        }),
        toArray(),
        map((users: any) => {
          const response: IResponse = {
            status: HttpStatus.OK,
            data: plainToClass(User, users, {
              excludeExtraneousValues: true,
            }),
          };
          return response;
        }),
    );
  }

  public authCli(clikey: any) {

    const { idNamespace, idFunctions, cliKey } = clikey;

    if (isEmpty(cliKey)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return from(this.cliModel.findOne({ 'keys.key': cliKey })).pipe(
        mergeMap((cli$: Cli) => {
          if (cli$ === null || cli$.idUser === null || cli$.idUser === undefined) {
            throw new UnauthorizedException('Invalid credentials');
          }
          return from(this.userModel.findById(cli$.idUser));
        }),
        mergeMap((user$: User) => {
          const profiles: Profile[] = user$.profiles.map((profile$: any) => {
            return {
              id: profile$.id,
              provider: profile$.provider,
              accessToken: profile$.accessToken,
              login: profile$.login || profile$.name,
            };
          });
          const payload = {
            email: user$.email,
            id: user$.id.toString(),
            profiles,
            typeClient: user$.typeClient,
          };
          //  return payload;
          return this.getNamespacefunctions(payload.id).pipe(
              map((namespaces: any[]) => {
                if (idNamespace) {
                  const n = namespaces.find(
                      (namespace: any) => namespace._id === idNamespace,
                  );
                  if (!n) {
                    return false;
                  }
                  if (idFunctions) {
                    const f = n.functions.find((f: any) => f._id === idFunctions);
                    if (!f) {
                      return false;
                    }
                  }

                  return payload;
                } else {
                  return payload;
                }
              }),
          );
        }),
    );

  }

  public generateCli(user: User) {
    const key: string = AuthHelper.generateCliKey();
    return from(this.cliModel.findOne({ idUser: user.id })).pipe(
        map((cli$: any) => {
          if (cli$ === null) {
            const cli: Cli = new Cli();
            cli.idUser = user.id;
            const keys: Key[] = [];
            keys.push({ key, createdAt: new Date() });
            cli.keys = keys;
            return new this.cliModel(cli);

          } else {
            cli$.keys.push({ key, createdAt: new Date() });
            return cli$;
          }
        }),
        mergeMap((cli$: any) => {

          return from(cli$.save()).pipe(
              map((cli$$: Cli) => {

                cli$$.keys = cli$$.keys.filter((key$$$: Key) => key$$$.key === key);
                const response: IResponse = {
                  status: HttpStatus.OK,
                  data: plainToClass(
                      Cli,
                      cli$$,
                      { excludeExtraneousValues: true },
                  ),
                };
                return response
              }));
        }),
    );
  }

  public getAllCliKey(user: User) {
    return from(this.cliModel.findOne({ idUser: user.id })).pipe(
        map((cli$: Cli) => {
          if (cli$ !== null) {
            cli$.keys = cli$.keys.map((key: Key) => {
              const keys: string[] = key.key.split('-');
              const keyEnd: string = keys.pop();
              key.key = `xxxxxxxx-xxxx-xxxx-xxxx-${keyEnd}`;
              return key;
            });
          } else {
            cli$ = new Cli();
            cli$.idUser = user.id;
            cli$.keys = [];
          }

          const response: IResponse = {
            status: HttpStatus.OK,
            data: plainToClass(
                Cli,
                cli$,
                { excludeExtraneousValues: true },
            ),
          };
          return response
        }),
    );
  }

  public deleteCliKey(user: User, cliKeyId: string) {

    return from(this.cliModel.findOne({ idUser: user.id })).pipe(
        map((cli$: any) => {
          if (cli$ === null) {

          } else {
            cli$.keys = cli$.keys.filter((cliKey: Key) => cliKey.id !== cliKeyId);
            return cli$;
          }
        }),
        mergeMap((cli$: any) => {
          return from(cli$.save());
        }),
    );
  }

  private addProfile(user: User, profile: Profile) {
    if (user.profiles.find((profile$: Profile) => profile$.id === profile.id)) {
      const profiles: Profile[] = user.profiles.map((profile$: any) => {
        return {
          id: profile$.id,
          provider: profile$.provider,
          accessToken: profile$.accessToken,
          login: profile$.login || profile$.name,
        };
      });
      const jwtPayload = {
        email: user.email,
        id: user.id.toString(),
        profiles,
        typeClient: user.typeClient,
      };
      return this.validateUserProfile(jwtPayload);
    } else {
      user.profiles.push(profile);
      const createdUser = new this.userModel(user);
      return from(createdUser.save()).pipe(
          mergeMap((user$: User) => {
            const profiles: Profile[] = user$.profiles.map((profile$: any) => {
              return {
                id: profile$.id,
                provider: profile$.provider,
                accessToken: profile$.accessToken,
                login: profile$.login || profile$.name,
              };
            });
            const jwtPayload = {
              email: user.email,
              id: user.id.toString(),
              profiles,
              typeClient: user.typeClient,
            };
            return this.validateUserProfile(jwtPayload);
          }),
      );
    }
  }

  private signProvider(authCredentialsDto: AuthCredentialsDto) {
    const { email, password, profile } = authCredentialsDto;

    const user = new User();
    user.email = email;
    user.typeClient = ClientType.Developer;
    user.profiles = Array.of(profile);
    const salt$ = from(bcrypt.genSalt()).pipe(
        tap((salt: string) => {
          user.salt = salt;
        }),
    );

    return salt$.pipe(
        mergeMap((salt: string) => {
          return this.hashPassword(password, salt);
        }),
        map((password$: string) => {
          user.password = password$;
          user.status = AuthHelper.getEnabledMessage();
          const createdUser = new this.userModel(user);
          return createdUser;
        }),
        mergeMap((createdUser: any) => {
          return from(createdUser.save()).pipe(
              catchError(error => {
                if (error.code === 11000) {
                  // duplicate username
                  throw new ConflictException('Username already exists');
                } else {
                  console.error(error);
                  throw new InternalServerErrorException();
                }
              }),
          );
        }),
        mergeMap((createdUser: User) => {
          const profiles: Profile[] = createdUser.profiles.map(
              (profile$: any) => {
                return {
                  id: profile$.id,
                  provider: profile$.provider,
                  accessToken: profile$.accessToken,
                  login: profile$.login || profile$.name,
                };
              },
          );

          const jwtPayload: IjwtPayload = {
            email: user.email,
            id: createdUser.id.toString(),
            profileId: profile.id,
            profiles,
            typeClient: user.typeClient,
          };
          return this.validateUserProfile(jwtPayload);
        }),
    );
  }

  private hashPassword(password: string, salt: string): Observable<string> {
    return from(bcrypt.hash(password, salt) as string);
  }

  public validateToken(iAccessToken: IAccessToken): Observable<any> {
    const { idnamespaces, idfunctions, idcluster } = iAccessToken;
    try {
      const payload: IjwtPayload = this.jwtService.verify(
        iAccessToken.accessToken,
      );
      const obsALl = of(payload);
      const obsCluster = this.getClusterByid(payload.id, idcluster).pipe(
        map((cluster: any) => {
          if (cluster !== null) {
            return payload;
          }
          return  false;
        }));
      const obsNamespacefunctions = this.getNamespacefunctions(payload.id).pipe(
        map((namespaces: any[]) => {
          if (idnamespaces) {
            const n = namespaces.find(
              (namespace: any) => namespace._id === idnamespaces,
            );
            if (!n) {
              return false;
            }
            if (idfunctions) {
              const f = n.functions.find((f: any) => f._id === idfunctions);
              if (!f) {
                return false;
              }
            }

            return payload;
          } else {
            return payload;
          }
        }),
      );

      if ((!idcluster && !idnamespaces && !idfunctions)) {
        return obsALl;
      } else if (idnamespaces || idfunctions) {
        return obsNamespacefunctions;
      } else if (idcluster) {

        return obsCluster;
      } else {
        return of(false);
      }

    } catch (e) {
      console.log(e);

    }
  }

  private validateUserProfile(jwtPayload: IjwtPayload) {
    return from(this.jwtService.signAsync(jwtPayload)).pipe(
      map((accessToken: string) => {
        return { accessToken };
      }),
    );
  }

  private getNamespacefunctions(idUser: string) {

    return from(
      this.connection
        .collection('namespaces')
        .aggregate([
          { $match: { idUser } },
          {
            $project: {
              _id: {
                $toString: '$_id',
              },
            },
          },
          {
            $lookup: {
              from: 'functions',
              let: { idNamespace: '$_id' },
              pipeline: [
                {
                  $match: { $expr: { $eq: ['$idNamespace', '$$idNamespace'] } },
                },
                {
                  $project: {
                    _id: {
                      $toString: '$_id',
                    },
                  },
                },
              ],
              as: 'functions',
            },
          },
        ])
        .toArray(),
    );
  }

  private getClusterByid(idUser: string, idCluster) {
    const ObjectId = require('mongoose').Types.ObjectId;
    return from(
      this.connection
        .collection('clusters').findOne({ _id: new ObjectId(idCluster), idUser }),
    );
  }


}
