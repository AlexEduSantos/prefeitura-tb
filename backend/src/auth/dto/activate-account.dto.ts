import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Token de ativação é obrigatório.' })
  token!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve possuir no mínimo 6 caracteres.' })
  password!: string;
}
