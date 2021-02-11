import {Module} from '@nestjs/common';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {User, UserSchema} from './entitys/user';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from './jwt.strategy';
import {JwtAuthGuard} from './JwtAuthGuard';

import {Db, MongoClient} from 'mongodb';
import {Cli, CliSchema} from './entitys/cli';
import {MongooseModule} from "@nestjs/mongoose";
import {HealthModule} from "./health/health.module";


@Module({
    imports: [
        HealthModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `./config.${process.env.NODE_ENV}.env`,
        }),
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_SECRET_EXPIRES_IN'),
                },
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const uri: string = `mongodb://${configService.get('MONGODB_USERNAME')}:${configService.get('MONGODB_PASSWORD')}@${configService.get('MONGODB_HOST')}:27017/${configService.get('MONGODB_DB')}`;
                return {
                    uri,
                    useNewUrlParser: true,
                    useCreateIndex: true,
                    useFindAndModify: false,
                    useUnifiedTopology: false,
                    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
                    reconnectInterval: 1000, // Reconnect every 500ms
                    bufferMaxEntries: 0,
                    connectTimeoutMS: 20000,
                    socketTimeoutMS: 45000,
                    connectionFactory: (connection) => {
                        connection.plugin(require('mongoose-timestamp'));
                        return connection;
                    }
                }
            },
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([{name: Cli.name, schema: CliSchema},
            {name: User.name, schema: UserSchema}]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
    ],
})
export class AuthModule {
}
