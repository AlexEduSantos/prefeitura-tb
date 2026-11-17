import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService, sanitizeFilename } from './media.service';
import { MediaGateway } from './media.gateway';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';
import { detectFileTypeFromBuffer } from '../common/utils/file-type-detector';

const execFileAsync = promisify(execFile);

interface MediaJobPayload {
  mediaId?: string;
  tempFilePath?: string;
  moveOperations?: Array<{ oldKey: string; newKey: string }>;
  folderPath?: string;
}

/**
 * Extrai texto plano de buffers PDF usando `pdf-parse` para indexação Full-Text Search.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) return '';

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result?.text?.trim() || '';
    if (text) return text;
  } catch {
    // Fallback para streams PDF minimalistas/sintéticos sem tabela xref completa
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  const raw = buffer.toString('latin1');
  const matches: string[] = [];
  const tjRegex = /\(([^()]{2,})\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(raw)) !== null) {
    matches.push(match[1]);
  }
  return matches.join(' ').trim();
}

@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly mediaGateway: MediaGateway,
  ) {
    super();
  }

  async process(job: Job<MediaJobPayload>): Promise<Record<string, unknown>> {
    const name = job.name;
    const data = job.data;

    if (name === 'optimize' || !name) {
      const mediaId = data.mediaId || '';
      const tempFilePath = data.tempFilePath || '';

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
        const fileType = detectFileTypeFromBuffer(fileBuffer);
        const ext = fileType?.ext || 'bin';
        const detectedMime =
          fileType?.mime || media.mimeType || 'application/octet-stream';

        let finalBuffer: Buffer = fileBuffer;
        let finalMimeType = detectedMime;
        let width: number | undefined = undefined;
        let height: number | undefined = undefined;
        let extractedText: string | undefined = undefined;
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
          const transcoded = await this.transcodeVideoWithFfmpeg(
            tempFilePath,
            relativeDir,
            sanitizedTitle,
            fileBuffer,
            ext,
            detectedMime,
          );
          finalBuffer = transcoded.buffer;
          finalMimeType = transcoded.mimeType;
          if (media.folderId && folderPath) {
            key = `${folderPath}${sanitizedTitle}-${Date.now()}.${transcoded.ext}`;
          } else {
            key = transcoded.key;
          }
        } else {
          if (ext === 'pdf' || detectedMime === 'application/pdf') {
            const parsed = await extractPdfText(fileBuffer);
            if (parsed) {
              extractedText = parsed;
            }
          }
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
            ...(extractedText !== undefined ? { extractedText } : {}),
          },
        });

        // 6. Remover arquivo temporário
        await fs.unlink(tempFilePath);

        // 7. Notificar via WebSocket
        this.mediaGateway.notifyMediaReady(mediaId, updatedMedia);

        return { success: true, mediaId };
      } catch (error: unknown) {
        console.error(`Erro ao processar mídia ${mediaId}:`, error);

        await this.prisma.media.update({
          where: { id: mediaId },
          data: { status: 'failed' },
        });

        try {
          await fs.unlink(tempFilePath);
        } catch {
          // Arquivo temporário já removido
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.mediaGateway.notifyMediaFailed(mediaId, errorMessage);
        throw error;
      }
    } else if (name === 'folders-move') {
      const moveOperations = data.moveOperations || [];
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
      const folderPath = data.folderPath || '';
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
    return { success: false };
  }

  /**
   * Transcodifica vídeos via FFmpeg nativo para MP4 (H.264/AAC) + HLS (.m3u8) em background.
   * Em caso de entrada sintética ou falha do FFmpeg, mantém fallback seguro para o arquivo original.
   */
  async transcodeVideoWithFfmpeg(
    inputPath: string,
    relativeDir: string,
    sanitizedTitle: string,
    fallbackBuffer: Buffer,
    fallbackExt: string,
    fallbackMime: string,
  ): Promise<{
    buffer: Buffer;
    key: string;
    mimeType: string;
    ext: string;
    hlsKey?: string;
  }> {
    const timestamp = Date.now();
    const baseName = `${sanitizedTitle}-${timestamp}`;
    const workDir = join(tmpdir(), `pmtb-hls-${timestamp}`);
    const mp4Out = join(workDir, `${baseName}.mp4`);
    const hlsDir = join(workDir, 'hls');
    const m3u8Out = join(hlsDir, 'index.m3u8');

    try {
      await fs.mkdir(hlsDir, { recursive: true });
      await this.runFfmpeg([
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        mp4Out,
      ]);

      await this.runFfmpeg([
        '-y',
        '-i',
        mp4Out,
        '-c:v',
        'copy',
        '-c:a',
        'copy',
        '-f',
        'hls',
        '-hls_time',
        '6',
        '-hls_list_size',
        '0',
        m3u8Out,
      ]);

      const hlsFiles = await fs.readdir(hlsDir);
      const hlsPrefix = `videos/${relativeDir}/${baseName}/hls`;
      for (const file of hlsFiles) {
        const segmentBuf = await fs.readFile(join(hlsDir, file));
        const segmentMime = file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T';
        await this.mediaService.uploadToS3(
          `${hlsPrefix}/${file}`,
          segmentBuf,
          segmentMime,
        );
      }

      const mp4Buffer = await fs.readFile(mp4Out);
      return {
        buffer: mp4Buffer,
        key: `videos/${relativeDir}/${baseName}.mp4`,
        mimeType: 'video/mp4',
        ext: 'mp4',
        hlsKey: `${hlsPrefix}/index.m3u8`,
      };
    } catch {
      return {
        buffer: fallbackBuffer,
        key: `videos/${relativeDir}/${baseName}.${fallbackExt}`,
        mimeType: fallbackMime,
        ext: fallbackExt,
      };
    } finally {
      await fs
        .rm(workDir, { recursive: true, force: true })
        .catch(() => undefined);
    }
  }

  protected async runFfmpeg(args: string[]): Promise<void> {
    await execFileAsync('ffmpeg', args);
  }
}
