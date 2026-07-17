import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;
}
