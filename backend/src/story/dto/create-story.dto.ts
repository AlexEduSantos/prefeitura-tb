import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CreateStoryItemDto } from './create-story-item.dto';

export class CreateStoryDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsUUID()
  coverId!: string;

  @IsArray()
  @IsOptional()
  items?: CreateStoryItemDto[];
}
