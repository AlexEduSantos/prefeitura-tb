import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsEnum,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { PopupStatus, PopupType } from '../../generated/prisma/enums';

export class CreatePopupDto {
  @IsString()
  title!: string;

  @IsUUID()
  imageId!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  displayTime?: number;

  @IsOptional()
  @IsEnum(PopupStatus)
  status?: PopupStatus;

  @IsOptional()
  @IsEnum(PopupType)
  type?: PopupType;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsBoolean()
  closeButton?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== '')
  @IsUUID()
  organizationId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== '')
  @IsUUID()
  spaceId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== '')
  @IsUUID()
  userId?: string;
}
