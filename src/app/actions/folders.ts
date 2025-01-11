"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

const folderLogger = logger.withContext('FolderActions');

export interface FolderCreate {
  name: string;
  path: string;
  totalFiles?: number;
  totalSize?: number;
  lastIndexed?: Date;
}

export interface FolderUpdate extends Partial<Omit<FolderCreate, 'path'>> {
  id: string;
  path?: string;
}

export async function getFolders() {
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
    throw new Error("No se pudieron obtener las carpetas");
  }
}

export async function getFolder(id: string) {
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
      throw new Error("Carpeta no encontrada");
    }

    folderLogger.info('✅ Carpeta obtenida:', folder.name);
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al obtener carpeta:", error);
    throw new Error("No se pudo obtener la carpeta");
  }
}

export async function createFolder(data: FolderCreate) {
  try {
    folderLogger.info('📝 Creando nueva carpeta:', data.name);
    const folder = await prisma.folder.create({
      data: {
        ...data,
        totalFiles: data.totalFiles || 0,
        totalSize: data.totalSize || 0,
        lastIndexed: data.lastIndexed || new Date(),
      },
    });
    folderLogger.info('✅ Carpeta creada:', folder.name);
    revalidatePath("/settings");
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al crear carpeta:", error);
    throw new Error("No se pudo crear la carpeta");
  }
}

export async function updateFolder(id: string, data: FolderUpdate) {
  try {
    folderLogger.info('📝 Actualizando carpeta:', id);
    const folder = await prisma.folder.update({
      where: { id },
      data,
    });
    folderLogger.info('✅ Carpeta actualizada:', folder.name);
    revalidatePath("/settings");
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al actualizar carpeta:", error);
    throw new Error("No se pudo actualizar la carpeta");
  }
}

export async function deleteFolder(id: string) {
  try {
    folderLogger.info('🗑️ Eliminando carpeta:', id);
    await prisma.folder.delete({
      where: { id },
    });
    folderLogger.info('✅ Carpeta eliminada');
    revalidatePath("/settings");
  } catch (error) {
    folderLogger.error("❌ Error al eliminar carpeta:", error);
    throw new Error("No se pudo eliminar la carpeta");
  }
}

export async function getFolderImages(id: string) {
  try {
    folderLogger.info('🖼️ Obteniendo imágenes de la carpeta:', id);
    const images = await prisma.image.findMany({
      where: {
        folderId: id,
      },
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        hash: true,
        width: true,
        height: true,
        metadata: true,
        thumbnail: true,
        folderId: true,
      },
    });

    folderLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images.map(image => ({
      ...image,
      type: 'image',
    }));
  } catch (error) {
    folderLogger.error("❌ Error al obtener imágenes de la carpeta:", error);
    throw new Error("No se pudieron obtener las imágenes de la carpeta");
  }
}

export async function updateFolderStats(id: string, stats: { totalFiles: number; totalSize: number }) {
  try {
    folderLogger.info('📊 Actualizando estadísticas de carpeta:', { id, stats });
    const folder = await prisma.folder.update({
      where: { id },
      data: {
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        lastIndexed: new Date(),
      },
    });
    folderLogger.info('✅ Estadísticas de carpeta actualizadas:', folder.name);
    revalidatePath("/settings");
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al actualizar estadísticas de carpeta:", error);
    throw new Error("No se pudieron actualizar las estadísticas de la carpeta");
  }
}

export async function getFolderByPath(path: string) {
  try {
    folderLogger.info('🔍 Buscando carpeta por ruta:', path);
    const folder = await prisma.folder.findUnique({
      where: { path },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!folder) {
      folderLogger.warn('❌ Carpeta no encontrada:', path);
      return null;
    }

    folderLogger.info('✅ Carpeta encontrada:', folder.name);
    return folder;
  } catch (error) {
    folderLogger.error("❌ Error al buscar carpeta por ruta:", error);
    throw new Error("No se pudo buscar la carpeta por ruta");
  }
}