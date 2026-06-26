import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @IsOptional()
  id?: string; // Client-side or temporary ID to match parent-child relations in the payload

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  url?: string;

  @IsUUID()
  @IsOptional()
  pageId?: string;

  @IsString()
  @IsOptional()
  parentId?: string; // References the client/temp ID of another item in the same array
}
