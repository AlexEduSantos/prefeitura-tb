import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { PopupStatus, PopupType } from '../../generated/prisma/enums';

export class CreatePopupDto {
  @IsString()
  name!: string;

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

  @IsUUID()
  entityId!: string;
}
