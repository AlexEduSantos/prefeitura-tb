import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';
import { CreateMenuItemDto } from './create-menu-item.dto';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsArray()
  @IsOptional()
  items?: CreateMenuItemDto[];
}
