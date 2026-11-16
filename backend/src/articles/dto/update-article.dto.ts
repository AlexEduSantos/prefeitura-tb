import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
} from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  @IsOptional()
  cover?: string;

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
