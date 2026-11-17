import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      'Busca global unificada em notícias, diário oficial e páginas públicas',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite máximo de itens por categoria (1-50)',
  })
  search(@Query('q') q = '', @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 15;
    return this.searchService.searchAll(
      q,
      Number.isFinite(parsedLimit) ? parsedLimit : 15,
    );
  }
}
