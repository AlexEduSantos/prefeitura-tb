import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsUUID,
  IsBoolean,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../generated/prisma/enums';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  phone?: string | null;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsUUID()
  organizationId!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
