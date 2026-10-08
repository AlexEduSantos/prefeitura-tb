import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { OrganizationTypes } from '../../generated/prisma/client';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  acronym?: string;

  @IsEnum(OrganizationTypes)
  @IsOptional()
  type?: OrganizationTypes;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  defaultSpaceId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
