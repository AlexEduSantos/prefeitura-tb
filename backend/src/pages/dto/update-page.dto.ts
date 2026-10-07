import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  content?: any;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsString()
  @IsOptional()
  spaceId?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
