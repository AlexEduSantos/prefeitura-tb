import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsNotEmpty()
  content: any; // Estrutura em formato JSON do Page Builder

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
