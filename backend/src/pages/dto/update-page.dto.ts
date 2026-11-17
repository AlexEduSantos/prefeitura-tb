import {
  IsString,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class UpdatePageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsString()
  description?: string;

  @IsOptional()
  content?: any;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsString()
  spaceId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsString()
  organizationId?: string | null;
}
