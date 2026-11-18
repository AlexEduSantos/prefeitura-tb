import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateGalleryMediaDto {
  @ValidateIf((o: CreateGalleryMediaDto) => !o.bannerId)
  @IsUUID()
  galleryId?: string;

  // Alias legado mantido apenas para compatibilidade de chamadas antigas
  @IsOptional()
  @IsUUID()
  bannerId?: string;

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
