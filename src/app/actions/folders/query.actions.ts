'use server';

/**
 * @file Query actions for folders
 * @module app/actions/folders/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import {
    mapFolderFiltersToPrisma,
    transformFolder,
    transformFolderToExtended
} from '@/transformers/folder';
import { type FolderComplete, type FolderFilters } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';

// Logger para acciones de consulta
const queryLogger = serverLogger.withContext('FolderQueryActions');

/**
 * Obtiene todas las carpetas
 * @param includeStats Si se deben incluir estadísticas avanzadas
 * @returns Lista de carpetas
 */
export async function getFolders(includeStats = false) {
  try {
    queryLogger.info('📂 Obteniendo todas las carpetas');

    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            children: true,
          }
        },
        parent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar a modelo extendido con transformador
    const transformedFolders = folders.map(folder => transformFolderToExtended(folder));

    queryLogger.info(`✅ Obtenidas ${transformedFolders.length} carpetas`);

    return transformedFolders;
  } catch (error) {
    queryLogger.error('❌ Error obteniendo carpetas:', error);
    throw new Error(`Error al obtener carpetas: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Obtiene una carpeta por su ID
 * @param id ID de la carpeta
 * @param includeStats Si se deben incluir estadísticas avanzadas
 * @returns Carpeta extendida
 */
export async function getFolderById(id: string, includeStats = false): Promise<FolderComplete> {
  try {
    queryLogger.info('🔍 Obteniendo carpeta por ID:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            children: true,
          }
        },
        parent: true,
        children: true,
      },
    });

    if (!folder) {
      throw new Error(`Carpeta con ID ${id} no encontrada`);
    }

    // Transformar a modelo completo con transformador
    const transformedFolder = transformFolder(folder);

    queryLogger.info('✅ Carpeta obtenida:', { id: transformedFolder.id, name: transformedFolder.name });

    return transformedFolder;
  } catch (error) {
    queryLogger.error(`❌ Error obteniendo carpeta ${id}:`, error);
    throw new Error(`Error al obtener carpeta: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Busca carpetas según filtros
 * @param filters Filtros para la búsqueda
 * @param options Opciones adicionales
 * @returns Lista de carpetas que coinciden con los filtros
 */
export async function searchFolders(
  filters: FolderFilters,
  options: {
    page?: number;
    limit?: number;
    sort?: string;
    includeStats?: boolean;
    includeImages?: boolean;
    includeVideos?: boolean;
    includeParent?: boolean;
    includeChildren?: boolean;
  } = {}
) {
  try {
    const {
      page = 1,
      limit = 50,
      sort = 'updatedAt:desc',
      includeStats = false,
      includeImages = false,
      includeVideos = false,
      includeParent = true,
      includeChildren = false,
    } = options;

    queryLogger.info('🔍 Buscando carpetas con filtros:', { filters, options });

    // Convertir filtros a prisma con el transformador
    const prismaFilters = mapFolderFiltersToPrisma(filters);

    // Determinar orden
    const [sortField, sortDirection] = sort.split(':');
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortField || 'updatedAt'] = (sortDirection === 'asc' ? 'asc' : 'desc');

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Construir includes dinámicamente
    const include: any = {
      _count: {
        select: {
          images: true,
          videos: true,
          children: true,
        }
      }
    };

    if (includeParent) include.parent = true;
    if (includeChildren) include.children = true;
    if (includeImages) include.images = { take: 5 }; // Limitar para evitar queries pesadas
    if (includeVideos) include.videos = { take: 5 }; // Limitar para evitar queries pesadas

    // Realizar búsqueda
    const [folders, totalCount] = await Promise.all([
      prisma.folder.findMany({
        where: prismaFilters,
        include,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.folder.count({
        where: prismaFilters,
      }),
    ]);

    // Transformar resultados
    const transformedFolders = folders.map(folder => transformFolderToExtended(folder));

    queryLogger.info(`✅ Búsqueda completada: ${transformedFolders.length} de ${totalCount} carpetas`);

    return {
      data: transformedFolders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    queryLogger.error('❌ Error buscando carpetas:', error);
    throw new Error(`Error al buscar carpetas: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Obtiene carpetas para la vista de árbol
 * Optimizado para navegación jerárquica
 */
export async function getFolderTree() {
  try {
    queryLogger.info('🌳 Obteniendo árbol de carpetas');

    // Optimizar query para árbol
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        parentId: true,
        emoji: true,
        color: true,
        totalFiles: true,
        _count: {
          select: {
            children: true,
            images: true,
            videos: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Construir estructura de árbol
    const folderMap = new Map();

    // Poblar el mapa usando for...of
    for (const folder of folders) {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        level: 0,
        isOpen: false,
        isSelected: false,
        hasChildren: folder._count.children > 0,
        totalItems: (folder._count.images || 0) + (folder._count.videos || 0),
      });
    }

    // Construir jerarquía de carpetas
    const rootFolders: any[] = [];

    // Construir relaciones padre-hijo usando for...of
    for (const folder of folders) {
      const folderWithMeta = folderMap.get(folder.id);

      if (folder.parentId && folderMap.has(folder.parentId)) {
        // Es una carpeta hija
        const parent = folderMap.get(folder.parentId);
        folderWithMeta.level = parent.level + 1;
        parent.children.push(folderWithMeta);
      } else {
        // Es una carpeta raíz
        rootFolders.push(folderWithMeta);
      }
    }

    queryLogger.info(`✅ Árbol de carpetas obtenido: ${rootFolders.length} carpetas raíz, ${folders.length} carpetas totales`);

    return rootFolders;
  } catch (error) {
    queryLogger.error('❌ Error obteniendo árbol de carpetas:', error);
    throw new Error(`Error al obtener árbol de carpetas: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Obtiene estadísticas generales de carpetas
 */
export async function getFoldersStats() {
  try {
    queryLogger.info('📊 Obteniendo estadísticas de carpetas');

    const [folderCount, totalImages, totalVideos, totalFolderSize, recentFolders] = await Promise.all([
      prisma.folder.count(),
      prisma.image.count(),
      prisma.video.count(),
      prisma.folder.aggregate({
        _sum: {
          totalSize: true,
        },
      }),
      prisma.folder.findMany({
        take: 5,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          totalFiles: true,
          totalSize: true,
        },
      }),
    ]);

    const stats = {
      totalFolders: folderCount,
      totalImages,
      totalVideos,
      totalFiles: totalImages + totalVideos,
      totalSize: totalFolderSize._sum.totalSize || 0,
      recentFolders,
    };

    queryLogger.info('✅ Estadísticas de carpetas obtenidas');

    return stats;
  } catch (error) {
    queryLogger.error('❌ Error obteniendo estadísticas de carpetas:', error);
    throw new Error(`Error al obtener estadísticas: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Revalida las rutas relacionadas con carpetas
 */
export async function revalidateFolderRoutes() {
  try {
    queryLogger.info('🔄 Revalidando rutas de carpetas');

    // Revalidar rutas que muestran carpetas
    revalidatePath('/folders');
    revalidatePath('/dashboard');
    revalidatePath('/api/folders');

    queryLogger.info('✅ Rutas revalidadas');

    return { success: true };
  } catch (error) {
    queryLogger.error('❌ Error revalidando rutas:', error);
    throw new Error(`Error al revalidar rutas: ${error instanceof Error ? error.message : String(error)}`);
  }
}