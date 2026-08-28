import {
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

  @IsUUID()
  @IsNotEmpty()
  storyId!: string;

  @IsUUID()
  @IsNotEmpty()
  mediaId!: string;
}
