import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
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
  }

  async updateSettings(updateDto: UpdateSettingsDto) {
    // O upsert garante que se não existir, ele cria, se existir, ele atualiza
    return this.prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateDto },
      update: updateDto,
    });
  }
}
