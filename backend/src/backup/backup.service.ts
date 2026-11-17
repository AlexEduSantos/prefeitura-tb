import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface BackupSummary {
  timestamp: string;
  filePath: string;
  databaseRecords: {
    articles: number;
    pages: number;
    officialGazettes: number;
    users: number;
    media: number;
  };
  minioObjectCount: number;
  status: 'completed' | 'failed';
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private lastBackup: BackupSummary | null = null;
  private readonly backupDir =
    process.env.BACKUP_DIR || join(tmpdir(), 'pmtb-backups');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleScheduledBackup() {
    this.logger.log('Iniciando rotina diária automatizada de backup...');
    return this.runBackup();
  }

  async runBackup(): Promise<BackupSummary> {
    const timestamp = new Date().toISOString();
    const safeTs = timestamp.replace(/[:.]/g, '-');
    const filePath = join(this.backupDir, `backup-${safeTs}.json`);

    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const [articles, pages, officialGazettes, users, media] =
        await Promise.all([
          this.prisma.article.findMany(),
          this.prisma.page.findMany(),
          this.prisma.officialGazette.findMany(),
          this.prisma.user.findMany({
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
              organizationId: true,
              active: true,
              createdAt: true,
            },
          }),
          this.prisma.media.findMany(),
        ]);

      const minioKeys = await this.listMinioObjects();

      const snapshot = {
        timestamp,
        database: {
          articles,
          pages,
          officialGazettes,
          users,
          media,
        },
        minio: {
          bucket: this.configService.get<string>('S3_BUCKET') || 'prefeitura',
          objects: minioKeys,
        },
      };

      await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');

      const summary: BackupSummary = {
        timestamp,
        filePath,
        databaseRecords: {
          articles: articles.length,
          pages: pages.length,
          officialGazettes: officialGazettes.length,
          users: users.length,
          media: media.length,
        },
        minioObjectCount: minioKeys.length,
        status: 'completed',
      };

      this.lastBackup = summary;
      this.logger.log(
        `Backup concluído: ${articles.length} artigos, ${officialGazettes.length} diários oficiais e ${minioKeys.length} objetos S3.`,
      );
      return summary;
    } catch (err: any) {
      const summary: BackupSummary = {
        timestamp,
        filePath,
        databaseRecords: {
          articles: 0,
          pages: 0,
          officialGazettes: 0,
          users: 0,
          media: 0,
        },
        minioObjectCount: 0,
        status: 'failed',
        error: err?.message || 'Erro desconhecido no backup',
      };
      this.lastBackup = summary;
      this.logger.error('Falha ao executar backup automatizado', err?.stack);
      throw err;
    }
  }

  getLastBackupStatus(): BackupSummary | null {
    return this.lastBackup;
  }

  private async listMinioObjects(): Promise<string[]> {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const bucket = this.configService.get<string>('S3_BUCKET');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return [];
    }

    const s3 = new S3Client({
      endpoint,
      region: region || 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });

    try {
      const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
      return (res.Contents || [])
        .map((obj) => obj.Key)
        .filter((k): k is string => Boolean(k));
    } catch {
      return [];
    }
  }
}
