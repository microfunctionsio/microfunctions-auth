import {MicroFunctionException} from "../errors/micro.function.Exception";
import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  RpcExceptionFilter
} from "@nestjs/common";
import {Observable, throwError} from "rxjs";
import {catchError} from "rxjs/operators";
import {RpcException} from "@nestjs/microservices";
import { MessagesError} from "../messages";


@Injectable()
@Catch(MicroFunctionException)
export class ErrorsMicroFunctionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
        .handle()
        .pipe(
            catchError((err: MicroFunctionException) => {
                console.error('ErrorsInterceptor:', err);
                if (err instanceof MicroFunctionException) {
                    return throwError(err);
                }
                return throwError(new RpcException(err));
            }),
        );
  }
}


@Injectable()
@Catch(Error)
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
        .handle()
        .pipe(
            catchError((err:any) => {
              console.error('ErrorsInterceptor',err)
              if(err instanceof RpcException )return throwError(err)
              return throwError(new RpcException({
                status: HttpStatus.EXPECTATION_FAILED,
                code: MessagesError.authInternalServerError,
                message:'Internal server error ',
              }));
            } ),
        );
  }
}