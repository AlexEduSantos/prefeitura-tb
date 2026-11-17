import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  async getSettings() {
    const fetchSettings = async () => {
      const settings = await this.prisma.siteSettings.findUnique({
        where: { id: 'singleton' },
      });

      // Se não existir, cria o padrão no primeiro acesso
      if (!settings) {
        return this.prisma.siteSettings.create({
          data: { id: 'singleton' },
        });
      }

      return settings;
    };

    return this.cacheService
      ? this.cacheService.getOrSet('cache:settings:singleton', fetchSettings)
      : fetchSettings();
  }

  async updateSettings(updateDto: UpdateSettingsDto) {
    // O upsert garante que se não existir, ele cria, se existir, ele atualiza
    const updated = await this.prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateDto },
      update: updateDto,
    });
    await this.cacheService?.invalidateByPrefix('cache:settings');
    return updated;
  }
}
