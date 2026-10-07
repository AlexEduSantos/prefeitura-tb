import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
  IsEnum,
  IsJSON,
} from 'class-validator';

// Sugiro criar um enum correspondente
export enum ArticleStatusEnum {
  rascunho = 'rascunho',
  publicado = 'publicado',
  arquivado = 'arquivado',
  expirado = 'expirado',
  excluido = 'excluido',
}

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsUUID()
  @IsNotEmpty()
  coverId!: string;

  @IsNotEmpty()
  body: any;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsEnum(ArticleStatusEnum)
  @IsOptional()
  status?: ArticleStatusEnum;

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
  @IsNotEmpty()
  authorId!: string;

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

  @IsUUID()
  @IsOptional()
  galleryId?: string;

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
