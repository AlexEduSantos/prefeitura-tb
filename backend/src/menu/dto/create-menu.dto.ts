import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';
import { MenuLocation } from '../../generated/prisma/enums';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(MenuLocation)
  @IsNotEmpty()
  location!: MenuLocation;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsUUID()
  @IsOptional()
  spaceId?: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @IsDate()
  @IsOptional()
  updatedAt?: Date;
}
