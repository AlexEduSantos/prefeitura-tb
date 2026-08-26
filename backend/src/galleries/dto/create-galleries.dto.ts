import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGalleryMediaDto } from '../../gallery-media/dto/create-gallery-media.dto';

export class CreateGalleriesDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateGalleryMediaDto)
  slides?: CreateGalleryMediaDto[];
}
