import { Expose, Type } from 'class-transformer';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CliDocument = Cli & Document;
@Schema()
export class Key {
  @Expose()
  id?: string;
  @Prop()
  @Expose()
  key: string;
  @Prop()
  @Expose()
  createdAt: Date;

}
@Schema()
export class Cli {

  id: string;
  @Expose()
  @Prop({ type: Key })
  keys: Key[];
  @Prop()
  idUser: string;

}

export const CliSchema = SchemaFactory.createForClass(Cli);
