// create-story-item.dto.ts
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateStoryItemDto {
  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsUUID()
  @IsNotEmpty()
  mediaId!: string;

  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}
