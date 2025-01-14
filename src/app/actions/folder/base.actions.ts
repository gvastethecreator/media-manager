'use server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { existsSync } from 'fs';
import { BaseActions } from '../base.actions';
import { eventsService } from '@/services/events.service';
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service';
import { fsService } from '@/services/fs.server';
import type { Folder } from '@prisma/client';
import { FolderError } from './types';
import type { FolderCreate, FolderUpdate } from './types';

const folderLogger = logger.withContext('FolderActions');

const REVALIDATE_PATHS = [
  '/settings',
  '/folders',
  '/folders/[id]'
] as const;

export class FolderActions extends BaseActions<Folder, FolderCreate, FolderUpdate> {
  protected modelName = 'folder' as const;
  protected revalidatePaths = Array.from(REVALIDATE_PATHS);
  protected logger = folderLogger;

  async getFolders() {
    try {
      folderLogger.info('📁 Obteniendo lista de carpetas');
      const folders = await prisma.folder.findMany({
        include: {
          _count: {
            select: {
              images: true,
            },
          },
        },
      });

      folderLogger.info(`✅ ${folders.length} carpetas obtenidas`);
      return folders;
    } catch (error) {
      folderLogger.error("❌ Error al obtener carpetas:", error);
      throw new FolderError("No se pudieron obtener las carpetas", error);
    }
  }

  async getFolder(id: string) {
    try {
      folderLogger.info('🔍 Obteniendo carpeta:', id);
      const folder = await prisma.folder.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              images: true,
            },
          },
        },
      });

      if (!folder) {
        folderLogger.warn('❌ Carpeta no encontrada:', id);
        throw new FolderError("Carpeta no encontrada");
      }

      folderLogger.info('✅ Carpeta obtenida:', folder.name);
      return folder;
    } catch (error) {
      folderLogger.error("❌ Error al obtener carpeta:", error);
      if (error instanceof FolderError) throw error;
      throw new FolderError("No se pudo obtener la carpeta", error);
    }
  }

  async createFolder(path: string) {
    try {
      folderLogger.info('📁 Agregando nueva carpeta:', path);

      if (!path) {
        throw new FolderError('PATH_REQUIRED');
      }

      // Validar y normalizar la ruta
      const normalizedPath = fsService.normalizePath(path);
      folderLogger.info('Path normalizado:', { original: path, normalized: normalizedPath });

      if (!existsSync(normalizedPath)) {
        throw new FolderError('PATH_NOT_FOUND');
      }

      // Verificar si la carpeta ya existe
      const existingFolder = await prisma.folder.findFirst({
        where: { path: normalizedPath }
      });

      if (existingFolder) {
        throw new FolderError('FOLDER_EXISTS');
      }

      // Crear carpeta en la base de datos
      const folder = await prisma.folder.create({
        data: {
          path: normalizedPath,
          name: normalizedPath.split('\\').pop() || normalizedPath,
          lastIndexed: new Date()
        }
      });

      folderLogger.info('✅ Carpeta creada:', folder);

      // Emitir eventos
      eventsService.emit('folders:modified');
      statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);

      this.revalidateAllPaths();

      return folder;
    } catch (error) {
      folderLogger.error("❌ Error al crear carpeta:", error);
      if (error instanceof FolderError) throw error;
      throw new FolderError("No se pudo crear la carpeta", error);
    }
  }

  async updateFolder(id: string, data: FolderUpdate) {
    try {
      folderLogger.info('📝 Actualizando carpeta:', id);
      const folder = await prisma.folder.update({
        where: { id },
        data,
      });
      folderLogger.info('✅ Carpeta actualizada:', folder.name);
      this.revalidateAllPaths();
      return folder;
    } catch (error) {
      folderLogger.error("❌ Error al actualizar carpeta:", error);
      throw new FolderError("No se pudo actualizar la carpeta", error);
    }
  }

  async deleteFolder(id: string) {
    try {
      folderLogger.info('🗑️ Eliminando carpeta:', id);
      await prisma.folder.delete({
        where: { id },
      });
      folderLogger.info('✅ Carpeta eliminada');

      // Emitir eventos
      eventsService.emit('folders:modified');
      eventsService.emit('files:modified');
      statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
      statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

      this.revalidateAllPaths();
    } catch (error) {
      folderLogger.error("❌ Error al eliminar carpeta:", error);
      throw new FolderError("No se pudo eliminar la carpeta", error);
    }
  }
}