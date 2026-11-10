import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AuditService, AuditJobData } from './audit.service';

@Processor('audit')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly auditService: AuditService) {
    super();
  }

  async process(job: Job<AuditJobData, any, string>): Promise<any> {
    try {
      return await this.auditService.create(job.data);
    } catch (error) {
      this.logger.error(
        `Falha ao processar job de auditoria ID ${job.id}`,
        error,
      );
      throw error;
    }
  }
}

