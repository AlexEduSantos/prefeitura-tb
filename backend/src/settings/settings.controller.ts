import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'SiteSettings'))
  async updateSettings(@Body() updateDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateDto);
  }
}
