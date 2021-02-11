import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const authenticationModule = await NestFactory.create(AuthModule);
  const configService:ConfigService = authenticationModule.get(ConfigService)
  const guestUrls = [`amqp://${configService.get('RABBIT_USER')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBIT_HOST')}:5672`];
  authenticationModule.connectMicroservice({
    transport: Transport.RMQ,

    options: {
      urls: guestUrls,
      queue: 'microfunctions_auth',
      queueOptions: {
        durable: true,
      },
    },
  });
  if(process.env.NODE_ENV !== 'local')
  {
    await authenticationModule.listen(4000);
  }
  await authenticationModule.startAllMicroservicesAsync();

}

bootstrap();
