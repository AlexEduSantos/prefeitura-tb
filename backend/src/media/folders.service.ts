import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from './media.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class FoldersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    @InjectQueue('media-processing') private readonly mediaQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.migrateLegacyMedia();
  }

  async migrateLegacyMedia() {
    try {
      const legacyMedia = await this.prisma.media.findMany({
        where: {
          folderId: null,
          key: { not: null },
        },
      });

      if (legacyMedia.length === 0) return;

      for (const media of legacyMedia) {
        if (!media.key) continue;

        const parts = media.key.split('/');
        if (parts.length <= 1) {
          continue;
        }

        const folderParts = parts.slice(0, -1);
        let currentParentId: string | null = null;
        let currentPath = '';

        for (const part of folderParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          let folder = await this.prisma.folder.findUnique({
            where: { path: currentPath },
          });

          if (!folder) {
            folder = await this.prisma.folder.create({
              data: {
                name: part,
                path: currentPath,
                parentId: currentParentId,
              },
            });
            const keepKey = `${currentPath}/.keep`;
            try {
              await this.mediaService.uploadToS3(keepKey, Buffer.from(''), 'application/octet-stream');
            } catch (e) {
              // Ignore S3 errors during startup
            }
          }

          currentParentId = folder.id;
        }

        if (currentParentId) {
          await this.prisma.media.update({
            where: { id: media.id },
            data: { folderId: currentParentId },
          });
        }
      }
    } catch (err) {
      console.error('Erro ao migrar mídias legadas:', err);
    }
  }

  // Resolves the absolute path for a folder by traversing parentId recursively
  private async resolvePath(name: string, parentId?: string): Promise<string> {
    if (!parentId) {
      return name;
    }
    const parent = await this.prisma.folder.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException('Pasta pai não encontrada');
    }
    return `${parent.path}/${name}`;
  }

  async create(name: string, parentId?: string) {
    const path = await this.resolvePath(name, parentId);

    // Check if a folder with the same path already exists
    const existing = await this.prisma.folder.findUnique({
      where: { path },
    });
    if (existing) {
      throw new BadRequestException('Já existe uma pasta com este nome neste diretório');
    }

    const folder = await this.prisma.folder.create({
      data: {
        name,
        path,
        parentId: parentId || null,
      },
    });

    // Create a .keep file in MinIO/S3 to represent the empty directory structure
    const keepKey = `${path}/.keep`;
    await this.mediaService.uploadToS3(keepKey, Buffer.from(''), 'application/octet-stream');

    return folder;
  }

  async rename(id: string, newName: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });
    if (!folder) {
      throw new NotFoundException('Pasta não encontrada');
    }

    const oldPath = folder.path;
    // Compute the new path for the folder itself
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    if (oldPath === newPath) {
      return folder;
    }

    // Check if new path collides
    const existing = await this.prisma.folder.findUnique({
      where: { path: newPath },
    });
    if (existing) {
      throw new BadRequestException('Uma pasta com esse nome já existe neste nível');
    }

    // Recursively find and update all children paths and media keys in DB
    const allChildFolders = await this.getAllChildFolders(id);
    const allMedia = await this.getAllMediaInFolderTree(id);

    // Prepare path mappings for S3 rename/move operations
    const moveOperations: { oldKey: string; newKey: string }[] = [];

    // Add folder .keep files to S3 move list
    moveOperations.push({
      oldKey: `${oldPath}/.keep`,
      newKey: `${newPath}/.keep`,
    });

    for (const child of allChildFolders) {
      const childRelative = child.path.substring(oldPath.length);
      const childNewPath = newPath + childRelative;
      moveOperations.push({
        oldKey: `${child.path}/.keep`,
        newKey: `${childNewPath}/.keep`,
      });
    }

    // Add media files to S3 move list
    for (const media of allMedia) {
      if (media.key) {
        const mediaRelative = media.key.substring(oldPath.length);
        const mediaNewKey = newPath + mediaRelative;
        moveOperations.push({
          oldKey: media.key,
          newKey: mediaNewKey,
        });
      }
    }

    // Perform database updates in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Update the parent folder
      await tx.folder.update({
        where: { id },
        data: { name: newName, path: newPath },
      });

      // 2. Update child folders paths
      for (const child of allChildFolders) {
        const childRelative = child.path.substring(oldPath.length);
        const childNewPath = newPath + childRelative;
        await tx.folder.update({
          where: { id: child.id },
          data: { path: childNewPath },
        });
      }

      // 3. Update media keys and URLs in DB
      for (const media of allMedia) {
        if (media.key) {
          const mediaRelative = media.key.substring(oldPath.length);
          const mediaNewKey = newPath + mediaRelative;
          
          // Construct new URL if applicable
          let newUrl = media.url;
          if (media.url) {
            newUrl = media.url.replace(media.key, mediaNewKey);
          }

          await tx.media.update({
            where: { id: media.id },
            data: { key: mediaNewKey, url: newUrl },
          });
        }
      }
    });

    // Dispatch background job to MinIO/S3 using BullMQ to handle copy & delete commands
    await this.mediaQueue.add('folders-move', { moveOperations });

    return { success: true, newPath };
  }

  async move(id: string, newParentId: string | null) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });
    if (!folder) {
      throw new NotFoundException('Pasta não encontrada');
    }

    const oldPath = folder.path;
    let newPath = folder.name;

    if (newParentId) {
      if (newParentId === id) {
        throw new BadRequestException('Não é possível mover uma pasta para dentro de si mesma');
      }
      // Verify that newParentId is not a subfolder of folder (to avoid cycles)
      const children = await this.getAllChildFolders(id);
      if (children.some((child) => child.id === newParentId)) {
        throw new BadRequestException('Não é possível mover uma pasta para dentro de uma de suas subpastas');
      }

      const parent = await this.prisma.folder.findUnique({
        where: { id: newParentId },
      });
      if (!parent) {
        throw new NotFoundException('Pasta de destino não encontrada');
      }
      newPath = `${parent.path}/${folder.name}`;
    }

    if (oldPath === newPath) {
      return folder;
    }

    // Check if new path collides
    const existing = await this.prisma.folder.findUnique({
      where: { path: newPath },
    });
    if (existing) {
      throw new BadRequestException('Uma pasta com esse nome já existe no destino');
    }

    const allChildFolders = await this.getAllChildFolders(id);
    const allMedia = await this.getAllMediaInFolderTree(id);

    const moveOperations: { oldKey: string; newKey: string }[] = [];

    moveOperations.push({
      oldKey: `${oldPath}/.keep`,
      newKey: `${newPath}/.keep`,
    });

    for (const child of allChildFolders) {
      const childRelative = child.path.substring(oldPath.length);
      const childNewPath = newPath + childRelative;
      moveOperations.push({
        oldKey: `${child.path}/.keep`,
        newKey: `${childNewPath}/.keep`,
      });
    }

    for (const media of allMedia) {
      if (media.key) {
        const mediaRelative = media.key.substring(oldPath.length);
        const mediaNewKey = newPath + mediaRelative;
        moveOperations.push({
          oldKey: media.key,
          newKey: mediaNewKey,
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update the parent folder relation and path
      await tx.folder.update({
        where: { id },
        data: { parentId: newParentId, path: newPath },
      });

      // 2. Update child folders
      for (const child of allChildFolders) {
        const childRelative = child.path.substring(oldPath.length);
        const childNewPath = newPath + childRelative;
        await tx.folder.update({
          where: { id: child.id },
          data: { path: childNewPath },
        });
      }

      // 3. Update media records
      for (const media of allMedia) {
        if (media.key) {
          const mediaRelative = media.key.substring(oldPath.length);
          const mediaNewKey = newPath + mediaRelative;
          
          let newUrl = media.url;
          if (media.url) {
            newUrl = media.url.replace(media.key, mediaNewKey);
          }

          await tx.media.update({
            where: { id: media.id },
            data: { key: mediaNewKey, url: newUrl },
          });
        }
      }
    });

    await this.mediaQueue.add('folders-move', { moveOperations });

    return { success: true, newPath };
  }

  async remove(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });
    if (!folder) {
      throw new NotFoundException('Pasta não encontrada');
    }

    const oldPath = folder.path;

    // Delete folder from database (cascades automatically to all media and subfolders)
    await this.prisma.folder.delete({
      where: { id },
    });

    // Dispatch job to delete everything in background matching the folder prefix
    await this.mediaQueue.add('folders-delete', { folderPath: oldPath });

    return { success: true };
  }

  // Recursive helpers to fetch kids
  private async getAllChildFolders(folderId: string): Promise<any[]> {
    const children = await this.prisma.folder.findMany({
      where: { parentId: folderId },
    });
    
    let result = [...children];
    for (const child of children) {
      const grandChildren = await this.getAllChildFolders(child.id);
      result = result.concat(grandChildren);
    }
    return result;
  }

  private async getAllMediaInFolderTree(folderId: string): Promise<any[]> {
    const media = await this.prisma.media.findMany({
      where: { folderId },
    });

    const children = await this.prisma.folder.findMany({
      where: { parentId: folderId },
    });

    let result = [...media];
    for (const child of children) {
      const childMedia = await this.getAllMediaInFolderTree(child.id);
      result = result.concat(childMedia);
    }
    return result;
  }
}
