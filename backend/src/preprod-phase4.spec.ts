import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, writeFile, rm } from 'fs/promises';
import { MediaProcessor, extractPdfText } from './media/media.processor';
import { OfficialGazetteService } from './official-gazette/official-gazette.service';
import type { PrismaService } from './prisma/prisma.service';
import type { MediaService } from './media/media.service';
import type { MediaGateway } from './media/media.gateway';
import type { Job } from 'bullmq';

describe('TO-DO 2.0 Fase 4 — Evolução e Funcionalidades (Pós-Lançamento)', () => {
  describe('1. Indexação de PDFs do Diário Oficial (pdf-parse + tsvector)', () => {
    it('extractPdfText e MediaProcessor devem extrair texto de PDF e salvar extractedText no Prisma', async () => {
      const fakePdf = Buffer.from(
        '%PDF-1.4\n1 0 obj <<>> endobj\nBT /F1 12 Tf 72 720 Td (Decreto Municipal Licitacao 2026) Tj ET\n%%EOF',
      );
      const extracted = await extractPdfText(fakePdf);
      expect(extracted).toContain('Decreto Municipal Licitacao 2026');

      const tmpPdfPath = join(tmpdir(), `phase4-pdf-${Date.now()}.pdf`);
      writeFileSync(tmpPdfPath, fakePdf);

      const updateMock = vi.fn().mockResolvedValue({
        id: 'med-pdf-1',
        status: 'ready',
        extractedText: extracted,
      });
      const findUniqueMock = vi.fn().mockResolvedValue({
        id: 'med-pdf-1',
        title: 'Edicao 1544',
        type: 'document',
        mimeType: 'application/pdf',
        folderId: null,
      });
      const uploadToS3Mock = vi.fn().mockResolvedValue(undefined);

      const prismaMock = {
        media: {
          findUnique: findUniqueMock,
          update: updateMock,
        },
      } as unknown as PrismaService;
      const mediaServiceMock = {
        uploadToS3: uploadToS3Mock,
      } as unknown as MediaService;
      const gatewayMock = {
        notifyMediaReady: vi.fn(),
        notifyMediaFailed: vi.fn(),
      } as unknown as MediaGateway;

      const processor = new MediaProcessor(
        prismaMock,
        mediaServiceMock,
        gatewayMock,
      );

      const job = {
        name: 'optimize',
        data: { mediaId: 'med-pdf-1', tempFilePath: tmpPdfPath },
      } as unknown as Job;

      await processor.process(job);

      const readyUpdateCall = updateMock.mock.calls.find(
        (call) =>
          (call[0] as { data?: { status?: string } })?.data?.status === 'ready',
      );
      expect(readyUpdateCall).toBeDefined();
      expect(
        (readyUpdateCall?.[0] as { data?: { extractedText?: string } })?.data
          ?.extractedText,
      ).toContain('Decreto Municipal Licitacao 2026');
    });

    it('OfficialGazetteService.searchByFullText e schema/migration devem incluir contentText e extractedText', () => {
      const migrationSql = readFileSync(
        join(
          process.cwd(),
          'prisma',
          'migrations',
          '20261117210000_add_pdf_text_indexing',
          'migration.sql',
        ),
        'utf-8',
      );
      expect(migrationSql).toContain('extractedText');
      expect(migrationSql).toContain('contentText');

      const queryRawMock = vi.fn().mockResolvedValue([{ id: 'gaz-pdf-1' }]);
      const gazetteService = new OfficialGazetteService({
        $queryRaw: queryRawMock,
      } as unknown as PrismaService);

      return gazetteService.searchByFullText('decreto').then((ids) => {
        expect(ids).toEqual(['gaz-pdf-1']);
        const rawSqlParts = (queryRawMock.mock.calls[0][0] as string[]).join(
          ' ',
        );
        expect(rawSqlParts).toContain('contentText');
      });
    });
  });

  describe('2. Streaming de Vídeo HLS / H.264 MP4 via FFmpeg', () => {
    it('MediaProcessor.transcodeVideoWithFfmpeg deve gerar MP4 otimizado + playlist .m3u8 e enviar ao S3', async () => {
      const inputVideoPath = join(tmpdir(), `phase4-video-${Date.now()}.mp4`);
      await writeFile(inputVideoPath, Buffer.from('mock-mp4-data'));

      const uploadToS3Mock = vi.fn().mockResolvedValue(undefined);
      const processor = new MediaProcessor(
        {} as unknown as PrismaService,
        { uploadToS3: uploadToS3Mock } as unknown as MediaService,
        {
          notifyMediaReady: vi.fn(),
          notifyMediaFailed: vi.fn(),
        } as unknown as MediaGateway,
      );

      const runFfmpegSpy = vi
        .spyOn(
          processor as unknown as {
            runFfmpeg: (args: string[]) => Promise<void>;
          },
          'runFfmpeg',
        )
        .mockImplementation(async (args: string[]) => {
          const outFile = args[args.length - 1];
          const dir = join(outFile, '..');
          await mkdir(dir, { recursive: true });
          if (outFile.endsWith('.mp4')) {
            await writeFile(outFile, Buffer.from('transcoded-h264-mp4'));
          } else if (outFile.endsWith('.m3u8')) {
            await writeFile(outFile, '#EXTM3U\nsegment0.ts\n');
            await writeFile(join(dir, 'segment0.ts'), Buffer.from('ts-seg'));
          }
        });

      try {
        const result = await processor.transcodeVideoWithFfmpeg(
          inputVideoPath,
          '2026/11',
          'sessao-camara',
          Buffer.from('fallback'),
          'mp4',
          'video/mp4',
        );

        expect(runFfmpegSpy).toHaveBeenCalledTimes(2);
        expect(result.mimeType).toBe('video/mp4');
        expect(result.hlsKey).toContain('/hls/index.m3u8');
        expect(result.buffer.toString()).toBe('transcoded-h264-mp4');
        expect(uploadToS3Mock).toHaveBeenCalledWith(
          expect.stringContaining('/hls/index.m3u8'),
          expect.any(Buffer),
          'application/vnd.apple.mpegurl',
        );
      } finally {
        await rm(inputVideoPath, { force: true });
      }
    });
  });

  describe('3. Acessibilidade (@axe-core/playwright) e Testes Unitários Vitest no Frontend', () => {
    it('frontend deve integrar @axe-core/playwright no E2E e manter testes unitários em frontend/test/', () => {
      const frontendDir = join(process.cwd(), '..', 'frontend');
      const e2eSrc = readFileSync(
        join(frontendDir, 'e2e', 'portal.spec.ts'),
        'utf-8',
      );
      const unitTestPath = join(frontendDir, 'test', 'portal.test.ts');

      expect(e2eSrc).toContain('@axe-core/playwright');
      expect(e2eSrc).toContain('AxeBuilder');
      expect(existsSync(unitTestPath)).toBe(true);
    });
  });
});
