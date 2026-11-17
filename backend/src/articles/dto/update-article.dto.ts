import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsUUID()
  organizationId?: string | null;

  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsUUID()
  coverId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsUUID()
  galleryId?: string | null;

  @IsOptional()
  body?: any;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  publicationDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsUUID()
  @IsOptional()
  editorId?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @IsBoolean()
  @IsOptional()
  allowComments?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryImages?: string[];

  @IsBoolean()
  @IsOptional()
  galleryAutoplay?: boolean;

  @IsInt()
  @IsOptional()
  galleryInterval?: number;

  @IsBoolean()
  @IsOptional()
  galleryShowThumbnails?: boolean;

  @IsString()
  @IsOptional()
  socialPreviewTitle?: string;

  @IsString()
  @IsOptional()
  socialPreviewImage?: string;

  @IsString()
  @IsOptional()
  socialPreviewDescription?: string;
}
