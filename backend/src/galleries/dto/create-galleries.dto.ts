import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGallerySlideDto {
  @IsUUID()
  mediaId!: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  link?: string;
}

export class CreateGalleriesDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateGallerySlideDto)
  slides?: CreateGallerySlideDto[];
}
