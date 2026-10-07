import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
