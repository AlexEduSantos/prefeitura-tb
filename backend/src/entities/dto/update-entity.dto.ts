import { IsString, IsOptional } from 'class-validator';

export class UpdateEntityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
