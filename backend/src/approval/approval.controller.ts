import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { UserRole } from '../generated/prisma/enums';
import { extractRequestUser } from '../common/utils/workflow.util';

@UseGuards(SessionGuard, PoliciesGuard)
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'ContentChangeRequest'))
  findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { id: userId, role: userRole } = extractRequestUser(req);
    return this.approvalService.findAllRequests({
      status,
      entityType,
      requestedById: userRole === UserRole.USER ? userId : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'ContentChangeRequest'))
  findOne(@Param('id') id: string, @Request() req: any) {
    const actor = extractRequestUser(req);
    return this.approvalService.findOneRequest(id, actor);
  }

  @Patch(':id')
  @CheckPolicies((ability) =>
    ability.can(Action.Update, 'ContentChangeRequest'),
  )
  updateProposedData(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const actor = extractRequestUser(req);
    return this.approvalService.updateProposedData(
      id,
      body?.proposedData ?? {},
      actor,
    );
  }

  @Post(':id/resubmit')
  @CheckPolicies((ability) =>
    ability.can(Action.Create, 'ContentChangeRequest'),
  )
  resubmit(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const actor = extractRequestUser(req);
    return this.approvalService.resubmitRequest(
      id,
      body?.proposedData ?? {},
      actor,
    );
  }

  @Patch(':id/cancel')
  @CheckPolicies((ability) =>
    ability.can(Action.Update, 'ContentChangeRequest'),
  )
  cancel(@Param('id') id: string, @Request() req: any) {
    const actor = extractRequestUser(req);
    return this.approvalService.cancelRequest(id, actor);
  }

  @Patch(':id/approve')
  @CheckPolicies((ability) =>
    ability.can(Action.Approve, 'ContentChangeRequest'),
  )
  approve(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const { id: reviewerId } = extractRequestUser(req);
    return this.approvalService.approveRequest(
      id,
      reviewerId,
      body?.proposedData,
    );
  }

  @Patch(':id/reject')
  @CheckPolicies((ability) =>
    ability.can(Action.Approve, 'ContentChangeRequest'),
  )
  reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; rejectionReason?: string },
    @Request() req: any,
  ) {
    const { id: reviewerId } = extractRequestUser(req);
    return this.approvalService.rejectRequest(
      id,
      reviewerId,
      body?.reason ?? body?.rejectionReason,
    );
  }
}
