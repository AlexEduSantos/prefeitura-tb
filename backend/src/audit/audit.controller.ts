import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { FindAuditLogsDto } from './dto/find-audit.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit-logs')
@UseGuards(SessionGuard, PoliciesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Admin' as any))
  @ApiOperation({
    summary: 'Listar registros de auditoria com paginação e filtros',
  })
  findAll(@Query() query: FindAuditLogsDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Admin' as any))
  @ApiOperation({ summary: 'Obter detalhes de um log de auditoria por ID' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
