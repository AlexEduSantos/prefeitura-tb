import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  entityId!: string; // Deve ser o UUID de uma Secretaria (Entity) existente no banco

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
