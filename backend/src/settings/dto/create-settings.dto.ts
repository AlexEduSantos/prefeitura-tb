import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSettingsDto {
  @IsString()
  @IsNotEmpty()
  siteName!: string;

  @IsString()
  @IsOptional()
  siteDescription?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  primaryForegroundColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryForegroundColor?: string;

  @IsObject()
  @IsOptional()
  themeColors?: Record<string, string>;

  @IsString()
  @IsOptional()
  addressStreet?: string;

  @IsString()
  @IsOptional()
  addressNumber?: string;

  @IsString()
  @IsOptional()
  addressCity?: string;

  @IsString()
  @IsOptional()
  addressState?: string;

  @IsString()
  @IsOptional()
  addressZip?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  workingHours?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;
}
