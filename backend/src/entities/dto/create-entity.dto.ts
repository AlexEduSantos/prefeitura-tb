import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;
}
