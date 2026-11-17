import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@UseGuards(SessionGuard, PoliciesGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('run')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async runBackup() {
    return this.backupService.runBackup();
  }

  @Get('status')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  getStatus() {
    return (
      this.backupService.getLastBackupStatus() || {
        status: 'pending',
        message: 'Nenhum backup executado nesta sessão.',
      }
    );
  }
}
