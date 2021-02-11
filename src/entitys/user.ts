import { UserStatus } from '../classes/user.status';
import { Profile } from '../classes/profile';
import { TypeClientEnums } from '../enums/typeClient.enums';
import {Document} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Expose} from "class-transformer";

export type UserDocument = User & Document;

@Schema()
export class User {
  @Expose()
  id: string;
  @Expose()
  @Prop({
    type: String,
    required: [true, 'Please add an username'],
    unique: true,
    index: true,
  })
  email: string;
  @Prop({
    type: String,
    required: [true, 'Please add an password'],
    unique: true,
    index: true,
  })
  password: string;
  @Prop({
    type: String,
    required: [true, 'Please add an salt'],
    unique: true,
    index: true,
  })
  salt: string;
  @Prop({ required: [true, 'Please add an status'] ,type:UserStatus})
  status: UserStatus;
  @Expose()
  @Prop({ required: [true, 'Please add an type CLient'] ,type:TypeClientEnums})
  typeClient: TypeClientEnums;
  @Prop({type:Profile})
  profiles: Profile[];
  @Expose()
  createdAt: Date;

  @Expose()
  canDelete: boolean;
  @Expose()
  canChangePassword: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
