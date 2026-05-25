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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PoliciesGuard } from '../casl/policies.guard';
import { SessionGuard } from '../auth/session.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('image')
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
  uploadImage(
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
    return this.mediaService.uploadImage(createMediaDto, file);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('document')
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
  uploadDocument(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadDocument(createMediaDto, file);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('video')
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
  uploadVideo(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadVideo(createMediaDto, file);
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
