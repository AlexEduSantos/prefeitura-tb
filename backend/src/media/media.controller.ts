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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { SessionGuard } from 'src/auth/session.guard';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { Action } from 'src/casl/action.enum';

@Controller('media')
@UseGuards(SessionGuard, PoliciesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  async findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  async create(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      // Configurar a URL (caminho público ou referência para o bucket) e os metadados do arquivo
      createMediaDto.url = `/uploads/${file.filename}`;
      createMediaDto.file_size = file.size;
      createMediaDto.mime_type = file.mimetype;
      // createMediaDto.type pode ser inferido pelo mimetype (ex: 'image', 'video', etc)
      if (file.mimetype.startsWith('image/')) {
        createMediaDto.type = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        createMediaDto.type = 'video';
      }
    }
    
    // Se o usuário não enviou o tipo na DTO, garantimos que não está vazio
    if (!createMediaDto.type) {
        createMediaDto.type = 'document';
    }

    return this.mediaService.create(createMediaDto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Media'))
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
