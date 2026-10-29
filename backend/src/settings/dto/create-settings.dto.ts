import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSettingsDto {
  @IsString()
  @IsNotEmpty()
  siteName!: string;

  @IsString()
  @IsNotEmpty()
  siteDescription!: string;

  @IsString()
  @IsNotEmpty()
  logoUrl!: string;

  @IsString()
  @IsNotEmpty()
  faviconUrl!: string;

  @IsString()
  @IsNotEmpty()
  primaryColor!: string;

  @IsString()
  @IsNotEmpty()
  secondaryForegroundColor!: string;

  @IsObject()
  @IsNotEmpty()
  themeColors!: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  addressStreet!: string;

  @IsString()
  @IsNotEmpty()
  addressNumber!: string;

  @IsString()
  @IsNotEmpty()
  addressCity!: string;

  @IsString()
  @IsNotEmpty()
  addressState!: string;

  @IsString()
  @IsNotEmpty()
  addressZip!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  workingHours!: string;

  @IsObject()
  @IsNotEmpty()
  socialLinks!: Record<string, string>;
}
