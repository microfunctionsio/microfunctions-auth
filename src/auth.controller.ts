import {Controller, UseFilters, UseInterceptors, ValidationPipe} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthCredentialsDto} from './dto/auth-credentials.dto';
import {Observable} from 'rxjs';
import {IAccessToken} from './IjwtPayload';
import {MessagePattern, Payload} from '@nestjs/microservices';
import { ErrorsMicroFunctionInterceptor } from './interceptors/errors.interceptor';

@Controller('/auth/')
@UseInterceptors(new ErrorsMicroFunctionInterceptor())
export class AuthController {
  constructor(private authService: AuthService) {
  }

  @MessagePattern({ cmd: 'auth-signUp' })
  signUp(
    @Payload(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Observable<any> {
    return this.authService.signUp(authCredentialsDto);
  }

  @MessagePattern({ cmd: 'auth-signIn' })
  signIn(
    @Payload(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Observable<IAccessToken> {
    return this.authService.signIn(authCredentialsDto);
  }

  @MessagePattern({ cmd: 'auth-user' })
  accessToken(@Payload() iAccessToken: IAccessToken): Observable<any> {
    return this.authService.validateToken(iAccessToken);
  }

  @MessagePattern({ cmd: 'auth-signIn-provider' })
  providerLogin(@Payload() profile: any) {
    return this.authService.validateProfile(profile);
  }

  @MessagePattern({ cmd: 'auth-generate-cli' })
  generateCliKey(@Payload() user: any) {

    return this.authService.generateCli(user);
  }

  @MessagePattern({ cmd: 'get-cli-keys' })
  getAllCliKey(@Payload() user: any) {

    return this.authService.getAllCliKey(user);
  }

  @MessagePattern({ cmd: 'get-list-Collaborators' })
  getAllCollaborators(@Payload() user: any) {

    return this.authService.listCollaborators(user);
  }

  @MessagePattern({ cmd: 'delete-cli-key' })
  deleteCliKey(@Payload() payload: any) {
    const { cliKeyId } = payload;
    return this.authService.deleteCliKey(payload, cliKeyId);
  }

  @MessagePattern({ cmd: 'auth-cli' })
  authCli(@Payload() cli: any) {

    return this.authService.authCli(cli);
  }
}
