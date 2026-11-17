import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsString()
  description?: string;

  @IsNotEmpty()
  content: any; // Estrutura em formato JSON do Page Builder

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

  @IsString()
  @IsOptional()
  userId?: string;
}
