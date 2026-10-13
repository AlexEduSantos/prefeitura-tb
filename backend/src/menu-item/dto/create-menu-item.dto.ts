import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ExactlyOneOf } from '../../common/decorators/exactly-one-of.decorator';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  url?: string;

  @IsUUID()
  @IsOptional()
  pageId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsNotEmpty()
  @ExactlyOneOf(['pageId', 'categoryId', 'url'])
  menuId!: string;
}
