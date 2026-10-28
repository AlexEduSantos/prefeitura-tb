import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsUUID,
  IsBoolean,
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
  phone?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsUUID()
  organizationId!: string;

  @IsString()
  @IsUUID()
  role!: UserRole;
}
