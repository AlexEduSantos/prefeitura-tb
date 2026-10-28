import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string; // UUID de uma Organization existente no banco

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
