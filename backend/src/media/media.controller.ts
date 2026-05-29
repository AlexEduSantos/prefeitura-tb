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
  Req,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  HttpCode,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PoliciesGuard } from '../casl/policies.guard';
import { SessionGuard } from '../auth/session.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Request, Response } from 'express';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
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

      const presignedUrl = await this.mediaService.getPresignedUrl(key);
      return res.redirect(presignedUrl);
    } catch (err) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
  }

  @Get('list/*prefix')
  async listFiles(
    @Param('prefix') prefix: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'desc',
  ) {
    const normalizedPrefix = prefix === 'root' ? '' : prefix;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
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
    const tempFilePath = await this.mediaService.saveTempFile(file.buffer);
    const media = await this.mediaService.createPending(
      createMediaDto,
      'document',
      file.mimetype,
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
    const tempFilePath = await this.mediaService.saveTempFile(file.buffer);
    const media = await this.mediaService.createPending(
      createMediaDto,
      'video',
      file.mimetype,
    );
    await this.mediaQueue.add('optimize', { mediaId: media.id, tempFilePath });
    return media;
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get('images')
  findImages() {
    return this.mediaService.findImages();
  }

  @Get('documents')
  findDocuments() {
    return this.mediaService.findDocuments();
  }

  @Get('videos')
  findVideos() {
    return this.mediaService.findVideos();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Media'))
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
