import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  alt_text?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type!: string; // Ex: "image", "video", "audio", "document"

  @IsString()
  @IsOptional()
  url!: string;

  @IsInt()
  @IsOptional()
  file_size?: number;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  folderId?: string;
}
