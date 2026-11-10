import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindAuditLogsDto {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;

  @ApiPropertyOptional()
  action?: string;

  @ApiPropertyOptional()
  entity?: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;
}

