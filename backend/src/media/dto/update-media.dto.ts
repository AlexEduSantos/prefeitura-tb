import { IsString, IsOptional, IsInt, IsArray } from 'class-validator';

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  alt_text?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  url?: string;

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
}
