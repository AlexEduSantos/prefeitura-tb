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

  @IsOptional()
  @ValidateIf((_, val) => val !== undefined && val !== null && val !== '')
  @IsString()
  @MinLength(6)
  password?: string;

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

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== '')
  @IsUUID()
  organizationId?: string | null;

  @IsEnum(UserRole)
  role!: UserRole;
}
