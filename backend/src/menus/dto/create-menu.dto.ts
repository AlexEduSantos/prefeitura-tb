import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsUUID()
  @IsNotEmpty()
  entityId: string;
}
