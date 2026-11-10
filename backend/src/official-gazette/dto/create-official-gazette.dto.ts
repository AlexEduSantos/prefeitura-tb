import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOfficialGazetteDto {
  @ApiProperty({
    description: 'Título do boletim/diário oficial',
    example: 'Boletim Oficial nº 1542/2026',
  })
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Número da edição',
    example: '1542',
  })
  @IsString()
  @IsOptional()
  edition?: string;

  @ApiPropertyOptional({
    description: 'Resumo ou ementa dos atos contidos na edição',
    example: 'Decretos nº 101 a 105, Portarias e Editais de Licitação.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data de publicação impressa/oficial do documento (YYYY-MM-DD ou ISO)',
    example: '2026-11-10',
  })
  @IsDateString(
    {},
    { message: 'A data de publicação deve estar em formato válido (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'A data de publicação é obrigatória' })
  publicationDate!: string;

  @ApiProperty({
    description: 'URL ou caminho do arquivo PDF do diário oficial',
    example: 'https://storage.exemplo.com/gazettes/edicao-1542.pdf',
  })
  @IsString()
  @IsNotEmpty({ message: 'O arquivo PDF (fileUrl) é obrigatório' })
  fileUrl!: string;

  @ApiPropertyOptional({
    description: 'Tamanho do arquivo em bytes',
    example: 2548120,
  })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de páginas do documento',
    example: 48,
  })
  @IsNumber()
  @IsOptional()
  pageCount?: number;
}
