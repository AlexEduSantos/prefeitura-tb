import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateMenuItemDto {
  // ✅ Renomeado para evitar conflito com o ID real do banco
  @IsString()
  @IsOptional()
  tempId?: string; // Temporary client-side ID for parent-child matching

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  url?: string;

  @IsUUID()
  @IsOptional()
  pageId?: string;

  // ✅ Corrigido: UUID validation
  @IsUUID()
  @IsOptional()
  parentId?: string; // Now expects real UUID or null (for top-level items)

  // ✅ Adicionado: Obrigatório no model
  @IsUUID()
  @IsNotEmpty()
  menuId!: string;

  // ✅ Adicionado: Obrigatório no model
  @IsUUID()
  @IsNotEmpty()
  entityId!: string;
}
