import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateStoryItemDto } from './create-story-item.dto';

export class CreateStoryDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsUUID()
  coverId!: string;

  @IsArray()
  @IsOptional()
  items?: CreateStoryItemDto[];
}
