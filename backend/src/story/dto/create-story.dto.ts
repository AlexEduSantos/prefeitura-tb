import { IsOptional, IsString, IsUUID } from 'class-validator';

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
}
