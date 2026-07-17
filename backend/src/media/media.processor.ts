import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService, sanitizeFilename } from './media.service';
import { MediaGateway } from './media.gateway';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly mediaGateway: MediaGateway,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { name, data } = job;

    if (name === 'optimize' || !name) {
      const { mediaId, tempFilePath } = data;

      const media = await this.prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error(`Media with ID ${mediaId} not found`);
      }

      try {
        // 1. Atualiza status para processando
        await this.prisma.media.update({
          where: { id: mediaId },
          data: { status: 'processing' },
        });

        // 2. Ler arquivo temporário
        const fileBuffer = await fs.readFile(tempFilePath);
        const fileType = await fileTypeFromBuffer(fileBuffer);
        const ext = fileType?.ext || 'bin';
        const detectedMime =
          fileType?.mime || media.mimeType || 'application/octet-stream';

        let finalBuffer: any = fileBuffer;
        let finalMimeType = detectedMime;
        let width: number | undefined = undefined;
        let height: number | undefined = undefined;
        let key = '';

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const relativeDir = `${year}/${month}`;
        const sanitizedTitle = sanitizeFilename(media.title) || 'file';

        let folderPath = '';
        if (media.folderId) {
          const folder = await this.prisma.folder.findUnique({
            where: { id: media.folderId },
          });
          if (folder) {
            folderPath = `${folder.path}/`;
          }
        }

        // 3. Processamento/Otimização por tipo
        if (media.type === 'image') {
          let transformer = sharp(fileBuffer).webp({ quality: 80 });
          const metadata = await sharp(fileBuffer).metadata();

          if (metadata.width && metadata.width > 2000) {
            transformer = transformer.resize({
              width: 2000,
              withoutEnlargement: true,
            });
          }

          finalBuffer = await transformer.toBuffer();
          const finalMetadata = await sharp(finalBuffer).metadata();
          width = finalMetadata.width;
          height = finalMetadata.height;
          finalMimeType = 'image/webp';

          if (media.folderId && folderPath) {
            key = `${folderPath}${sanitizedTitle}-${Date.now()}.webp`;
          } else {
            key = `images/${relativeDir}/${sanitizedTitle}-${Date.now()}.webp`;
          }
        } else if (media.type === 'video') {
          if (media.folderId && folderPath) {
            key = `${folderPath}${sanitizedTitle}-${Date.now()}.${ext}`;
          } else {
            key = `videos/${relativeDir}/${sanitizedTitle}-${Date.now()}.${ext}`;
          }
        } else {
          if (media.folderId && folderPath) {
            key = `${folderPath}${sanitizedTitle}-${Date.now()}.${ext}`;
          } else {
            key = `documents/${relativeDir}/${sanitizedTitle}-${Date.now()}.${ext}`;
          }
        }

        // 4. Upload para o S3 (Minio)
        await this.mediaService.uploadToS3(key, finalBuffer, finalMimeType);

        // 5. Atualizar registro no banco com status 'ready' e os dados corretos
        const updatedMedia = await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            key,
            fileSize: finalBuffer.length,
            status: 'ready',
            mimeType: finalMimeType,
            width,
            height,
          },
        });

        // 6. Remover arquivo temporário
        await fs.unlink(tempFilePath);

        // 7. Notificar via WebSocket
        this.mediaGateway.notifyMediaReady(mediaId, updatedMedia);

        return { success: true, mediaId };
      } catch (error: any) {
        console.error(`Erro ao processar mídia ${mediaId}:`, error);

        await this.prisma.media.update({
          where: { id: mediaId },
          data: { status: 'failed' },
        });

        try {
          await fs.unlink(tempFilePath);
        } catch {}

        this.mediaGateway.notifyMediaFailed(
          mediaId,
          error.message || 'Erro desconhecido',
        );
        throw error;
      }
    } else if (name === 'folders-move') {
      const { moveOperations } = data;
      for (const op of moveOperations) {
        try {
          await this.mediaService.copyS3Object(op.oldKey, op.newKey);
          await this.mediaService.deleteS3Object(op.oldKey);
        } catch (err) {
          console.error(
            `Erro ao mover objeto S3 de ${op.oldKey} para ${op.newKey}:`,
            err,
          );
        }
      }
      this.mediaGateway.notifyFoldersUpdated();
      return { success: true, movedCount: moveOperations.length };
    } else if (name === 'folders-delete') {
      const { folderPath } = data;
      try {
        await this.mediaService.deleteS3Folder(folderPath);
      } catch (err) {
        console.error(
          `Erro ao deletar pasta S3 com prefixo ${folderPath}:`,
          err,
        );
      }
      this.mediaGateway.notifyFoldersUpdated();
      return { success: true, folderPath };
    }
  }
}
