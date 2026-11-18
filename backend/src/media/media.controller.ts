import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  NotFoundException,
  HttpCode,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { FoldersService } from './folders.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PoliciesGuard } from '../casl/policies.guard';
import { SessionGuard } from '../auth/session.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Request, Response } from 'express';
import { DeleteMediaDto } from './dto/delete-media.dto';
import { validateFileMagicBytes } from '../common/utils/file-type-detector';

export const videoDiskStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = join(tmpdir(), 'pmtb-uploads', 'tmp');
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      cb(null, tmpDir);
    } catch (err) {
      cb(err as Error, tmpDir);
    }
  },
  filename: (_req, _file, cb) => {
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    cb(null, uniqueName);
  },
});

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly foldersService: FoldersService,
    @InjectQueue('media-processing') private readonly mediaQueue: Queue,
  ) {}

  @Get('file/*path')
  async serveFile(
    @Param('path') path: string | string[],
    @Res() res: Response,
  ) {
    const rawPath = Array.isArray(path) ? path.join('/') : path;
    const key = decodeURIComponent(rawPath);
    if (!key) {
      throw new BadRequestException('Chave do arquivo não fornecida');
    }

    try {
      const media = await this.mediaService.findByKey(key);
      if (!media) {
        return res
          .status(404)
          .json({ message: 'Arquivo não encontrado no banco', path: key });
      }

      if (media.status !== 'ready') {
        return res
          .status(404)
          .json({ message: 'Arquivo ainda processando', status: media.status });
      }

      const s3Response = await this.mediaService.getS3Object(key);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', 'sandbox');
      res.setHeader(
        'Content-Type',
        s3Response.ContentType || 'application/octet-stream',
      );
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }

      if (s3Response.Body) {
        (s3Response.Body as any).pipe(res);
      } else {
        res.status(404).end();
      }
    } catch {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
  }

  @Get('presigned/*path')
  async getPresignedUrl(@Param('path') path: string | string[]) {
    const rawPath = Array.isArray(path) ? path.join('/') : path;
    const key = decodeURIComponent(rawPath);
    if (!key) {
      throw new BadRequestException('Chave do arquivo não fornecida');
    }
    if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
      throw new BadRequestException('Chave do arquivo inválida');
    }
    const media = await this.mediaService.findByKey(key);
    if (!media || media.status !== 'ready') {
      throw new NotFoundException('Arquivo não encontrado ou indisponível');
    }
    const url = await this.mediaService.getPresignedUrl(key);
    return { url };
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('list/*prefix')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  async listFiles(
    @Param('prefix') prefix: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'desc',
  ) {
    const normalizedPrefix = prefix === 'root' ? '' : prefix;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortOrder =
      sort.toLowerCase() === 'asc' ? ('asc' as const) : ('desc' as const);

    return this.mediaService.listByPrefix(
      normalizedPrefix,
      pageNum,
      limitNum,
      sortOrder,
    );
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('image')
  @HttpCode(202)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp',
          'image/tiff',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de imagem não permitido'), false);
        }
      },
    }),
  )
  async uploadImage(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const tempFilePath = await this.mediaService.saveTempFile(file.buffer);
    const media = await this.mediaService.createPending(
      createMediaDto,
      'image',
      file.mimetype,
    );
    await this.mediaQueue.add('optimize', { mediaId: media.id, tempFilePath });
    return media;
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('document')
  @HttpCode(202)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de documento não permitido'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const detected = await validateFileMagicBytes(file, 'document');
    const tempFilePath = await this.mediaService.saveTempFile(file.buffer);
    const media = await this.mediaService.createPending(
      createMediaDto,
      'document',
      detected.mime,
    );
    await this.mediaQueue.add('optimize', { mediaId: media.id, tempFilePath });
    return media;
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('video')
  @HttpCode(202)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: videoDiskStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Formato de vídeo não suportado'), false);
        }
      },
    }),
  )
  async uploadVideo(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const detected = await validateFileMagicBytes(file, 'video');
    const tempFilePath =
      file.path || (await this.mediaService.saveTempFile(file.buffer));
    const media = await this.mediaService.createPending(
      createMediaDto,
      'video',
      detected.mime,
    );
    await this.mediaQueue.add('optimize', { mediaId: media.id, tempFilePath });
    return media;
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.mediaService.findAll({ page, limit, skip, take });
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('images')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  findImages() {
    return this.mediaService.findImages();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('documents')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  findDocuments() {
    return this.mediaService.findDocuments();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('videos')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  findVideos() {
    return this.mediaService.findVideos();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete('')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Media'))
  async removeMany(@Body() body: DeleteMediaDto) {
    return this.mediaService.removeMany(body.ids);
  }

  // --- FOLDER ENDPOINTS ---

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('folders')
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  createFolder(@Body() body: { name: string; parentId?: string }) {
    return this.foldersService.create(body.name, body.parentId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('folders/:id/rename')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  renameFolder(@Param('id') id: string, @Body() body: { name: string }) {
    return this.foldersService.rename(id, body.name);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('folders/:id/move')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  moveFolder(
    @Param('id') id: string,
    @Body() body: { parentId: string | null },
  ) {
    return this.foldersService.move(id, body.parentId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete('folders/:id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Media'))
  removeFolder(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
