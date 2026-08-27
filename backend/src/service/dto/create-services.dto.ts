import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  title!: string;

  @IsString()
  link!: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsUUID()
  entityId!: string;

  @IsUUID()
  imageId!: string;
}
