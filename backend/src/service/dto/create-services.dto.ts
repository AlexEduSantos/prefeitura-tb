import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

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

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
