import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PrismaService } from '../prisma/prisma.service';
import { tmpdir } from 'os';
import { join } from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Media } from '../generated/prisma/client';
import { detectFileTypeFromBuffer } from '../common/utils/file-type-detector';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PaginationInput, resolvePagination } from '../common/utils/pagination';

export function sanitizeFilename(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-') // replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-') // remove duplicate hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

@Injectable()
export class MediaService {
  private readonly uploadBasePath = join(tmpdir(), 'pmtb-uploads');
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      region: this.configService.getOrThrow<string>('S3_REGION'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_KEY'),
      },
    });

    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET');
  }

  async uploadToS3(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<any> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    return this.s3Client.send(command);
  }

  async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 900 });
  }

  async getS3Object(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return this.s3Client.send(command);
  }

  async copyS3Object(oldKey: string, newKey: string) {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: encodeURIComponent(`${this.bucketName}/${oldKey}`),
      Key: newKey,
    });
    return this.s3Client.send(command);
  }

  async deleteS3Object(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return this.s3Client.send(command);
  }

  async deleteS3Objects(keys: string[]) {
    if (keys.length === 0) return;
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });
    return this.s3Client.send(command);
  }

  async deleteS3Folder(prefix: string) {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: normalizedPrefix,
    });
    const listResponse = await this.s3Client.send(listCommand);
    const keys = (listResponse.Contents || [])
      .map((item) => item.Key)
      .filter((key): key is string => !!key);

    const keepKey = `${prefix}/.keep`;
    if (!keys.includes(keepKey)) {
      keys.push(keepKey);
    }

    await this.deleteS3Objects(keys);
  }

  async uploadImage(createMediaDto: CreateMediaDto, file: any) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'image';
    const fileName = `${sanitizedTitle}-${Date.now()}.webp`;
    const key = `images/${relativeDir}/${fileName}`;

    let transformer = sharp(file.buffer).webp({ quality: 80 });

    const metadataSharp = await sharp(file.buffer).metadata();
    if (metadataSharp.width && metadataSharp.width > 2000) {
      transformer = transformer.resize({
        width: 2000,
        withoutEnlargement: true,
      });
    }

    const finalBuffer = await transformer.toBuffer();
    const finalMetadata = await sharp(finalBuffer).metadata();

    await this.uploadToS3(key, finalBuffer, 'image/webp');

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        key,
        fileSize: finalBuffer.length,
        type: 'image',
        mimeType: 'image/webp',
        width: finalMetadata.width,
        height: finalMetadata.height,
        status: 'ready',
      },
    });
  }

  async uploadDocument(createMediaDto: CreateMediaDto, file: any) {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
    const type = detectFileTypeFromBuffer(file.buffer);
    if (!type || !allowedExtensions.includes(type.ext)) {
      throw new BadRequestException(
        'Arquivo não corresponde ao tipo declarado',
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'document';
    const fileName = `${sanitizedTitle}-${Date.now()}.${type.ext}`;
    const key = `documents/${relativeDir}/${fileName}`;

    await this.uploadToS3(key, file.buffer, type.mime);

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        key,
        fileSize: file.buffer.length,
        type: 'document',
        mimeType: type.mime,
        status: 'ready',
      },
    });
  }

  async uploadVideo(createMediaDto: CreateMediaDto, file: any): Promise<Media> {
    const allowedExtensions = ['mp4', 'webm', 'ogg', 'mkv'];
    const type = detectFileTypeFromBuffer(file.buffer);
    if (!type || !allowedExtensions.includes(type.ext)) {
      throw new BadRequestException(
        'Arquivo não corresponde ao tipo declarado',
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativeDir = `${year}/${month}`;

    const sanitizedTitle = sanitizeFilename(createMediaDto.title) || 'video';
    const fileName = `${sanitizedTitle}-${Date.now()}.${type.ext}`;
    const key = `videos/${relativeDir}/${fileName}`;

    await this.uploadToS3(key, file.buffer, type.mime);

    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        key,
        fileSize: file.buffer.length,
        type: 'video',
        mimeType: type.mime,
        status: 'ready',
      },
    });
  }

  async findAll(pagination?: PaginationInput): Promise<Media[]> {
    const { skip, take } = resolvePagination(pagination);
    return this.prisma.media.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
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

  async removeMany(ids: string[]) {
    try {
      return await this.prisma.media.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Uma ou mais mídias selecionadas não podem ser excluídas pois estão em uso por Serviços ou outros módulos.',
        );
      }
      throw error;
    }
  }

  async findByKey(key: string): Promise<Media | null> {
    return this.prisma.media.findFirst({
      where: { key: key },
    });
  }

  async saveTempFile(buffer: Buffer): Promise<string> {
    const tempDir = join(this.uploadBasePath, 'tmp');
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }
    const tempFileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const tempFilePath = join(tempDir, tempFileName);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  async createPending(
    createMediaDto: CreateMediaDto,
    type: string,
    mimeType: string,
  ): Promise<Media> {
    return this.prisma.media.create({
      data: {
        ...createMediaDto,
        type,
        mimeType: mimeType,
        status: 'pending',
      },
    });
  }

  async listByPrefix(
    prefix: string | string[],
    page: number = 1,
    limit: number = 20,
    sort: 'asc' | 'desc' = 'desc',
  ) {
    const flatPrefix = Array.isArray(prefix) ? prefix.join('/') : prefix;
    const normalizedPrefix =
      flatPrefix && flatPrefix !== 'root' ? flatPrefix.replace(/\/$/, '') : '';

    let parentFolderId: string | null = null;
    if (normalizedPrefix) {
      const folder = await this.prisma.folder.findUnique({
        where: { path: normalizedPrefix },
      });
      if (!folder) {
        return {
          folders: [],
          files: [],
          currentFolderId: null,
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
      parentFolderId = folder.id;
    }

    // 1. Fetch child folders at this level
    const subfolders = await this.prisma.folder.findMany({
      where: { parentId: parentFolderId },
      orderBy: { title: 'asc' },
    });

    // 2. Fetch media files at this level (paginated)
    const [files, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { folderId: parentFolderId },
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.media.count({
        where: { folderId: parentFolderId },
      }),
    ]);

    return {
      folders: subfolders.map((f) => ({
        id: f.id,
        name: f.title,
        path: f.path,
      })),
      files,
      currentFolderId: parentFolderId,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
