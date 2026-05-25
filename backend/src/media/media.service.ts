import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Media } from '@prisma/client';
import { join } from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

function sanitizeFilename(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-') // replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-')          // remove duplicate hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
}

@Injectable()
export class MediaService {
  private readonly uploadBasePath = '/app/uploads';

  constructor(private readonly prisma: PrismaService) {}

  async uploadImage(createMediaDto: CreateMediaDto, file: any) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;
    const uploadDir = join(this.uploadBasePath, 'images', relativeDir);

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'image';
    const fileName = `${sanitizedTitle}-${Date.now()}.webp`;
    const filePath = join(uploadDir, fileName);

    let transformer = sharp(file.buffer).webp({ quality: 80 });

    const metadataSharp = await sharp(file.buffer).metadata();
    if (metadataSharp.width && metadataSharp.width > 2000) {
      transformer = transformer.resize({
        width: 2000,
        withoutEnlargement: true,
      });
    }

    await transformer.toFile(filePath);

    const finalMetadata = await sharp(filePath).metadata();

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        url: `http://localhost:3001/uploads/images/${relativeDir}/${fileName}`,
        file_size: (await fs.stat(filePath)).size,
        type: 'image',
        mime_type: 'image/webp',
        width: finalMetadata.width,
        height: finalMetadata.height,
      },
    });
  }

  async uploadDocument(createMediaDto: CreateMediaDto, file: any) {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
    const type = await fileTypeFromBuffer(file.buffer);
    if (!type || !allowedExtensions.includes(type.ext)) {
      throw new BadRequestException(
        'Arquivo não corresponde ao tipo declarado',
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;
    const uploadDir = join(this.uploadBasePath, 'documents', relativeDir);

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'document';
    const fileName = `${sanitizedTitle}-${Date.now()}.${type.ext}`;
    const filePath = join(uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        url: `http://localhost:3001/uploads/documents/${relativeDir}/${fileName}`,
        file_size: (await fs.stat(filePath)).size,
        type: 'document',
        mime_type: type.mime,
      },
    });
  }

  async uploadVideo(createMediaDto: CreateMediaDto, file: any): Promise<Media> {
    const allowedExtensions = ['mp4', 'webm', 'ogg', 'mkv'];
    const type = await fileTypeFromBuffer(file.buffer);
    if (!type || !allowedExtensions.includes(type.ext)) {
      throw new BadRequestException(
        'Arquivo não corresponde ao tipo declarado',
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;
    const uploadDir = join(this.uploadBasePath, 'videos', relativeDir);

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'video';
    const fileName = `${sanitizedTitle}-${Date.now()}.${type.ext}`;
    const filePath = join(uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        url: `http://localhost:3001/uploads/videos/${relativeDir}/${fileName}`,
        file_size: (await fs.stat(filePath)).size,
        type: 'video',
        mime_type: type.mime,
      },
    });
  }

  async findAll(): Promise<Media[]> {
    return this.prisma.media.findMany();
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new Error('Média not found');
    }
    return media;
  }

  async findImages(): Promise<Media[]> {
    return this.prisma.media.findMany({ where: { type: 'image' } });
  }

  async findDocuments(): Promise<Media[]> {
    return this.prisma.media.findMany({ where: { type: 'document' } });
  }

  async findVideos(): Promise<Media[]> {
    return this.prisma.media.findMany({ where: { type: 'video' } });
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    return this.prisma.media.update({
      where: { id },
      data: updateMediaDto,
    });
  }

  async remove(id: string): Promise<Media> {
    return this.prisma.media.delete({
      where: { id },
    });
  }
}
