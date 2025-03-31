'use server';

/**
 * @file Acciones de consulta para carpetas
 * @module app/actions/folders/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toFolderExtended } from '@/transformers/folder';
import { type FolderExtended } from '@/types/entities/folder';
import { unstable_cache } from 'next/cache';

// Logger específico para acciones de consulta
const logger = serverLogger.withContext('FolderActions:query');

// Tiempo de caché en segundos
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Error personalizado para consultas de carpetas
 */
class FolderQueryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'FolderQueryError';
  }
}

/**
 * Obtiene una carpeta específica por ID
 */
export async function getFolder(id: string): Promise<FolderExtended | null> {
  try {
    logger.info('🔍 Buscando carpeta por ID:', id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!folder) {
      logger.warn('⚠️ Carpeta no encontrada:', id);
      return null;
    }

    // Transformar la carpeta para la respuesta
    const transformedFolder = toFolderExtended(folder);

    logger.info('✅ Carpeta encontrada:', { id });
    return transformedFolder;
  } catch (error) {
    logger.error('❌ Error al buscar carpeta:', error);
    throw new FolderQueryError('No se pudo obtener la carpeta', 'GET_FAILED', error);
  }
}

/**
 * Obtiene todas las carpetas
 */
export async function getFolders(): Promise<FolderExtended[]> {
  const getCachedFolders = unstable_cache(
    async () => {
      try {
        logger.info('📋 Obteniendo lista de carpetas');

        const folders = await prisma.folder.findMany({
          include: {
            images: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        // Transformar las carpetas para la respuesta
        const transformedFolders = folders.map(toFolderExtended);

        logger.info('✅ Lista de carpetas obtenida:', { count: folders.length });
        return transformedFolders;
      } catch (error) {
        logger.error('❌ Error al obtener lista de carpetas:', error);
        throw new FolderQueryError('No se pudo obtener la lista de carpetas', 'LIST_FAILED', error);
      }
    },
    ['folders-list'],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ['folders'],
    }
  );

  return getCachedFolders();
}

/**
 * Obtiene carpetas por ruta
 */
export async function getFolderByPath(path: string): Promise<FolderExtended | null> {
  try {
    logger.info('🔍 Buscando carpeta por ruta:', path);

    const folder = await prisma.folder.findFirst({
      where: { path },
      include: {
        images: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!folder) {
      logger.warn('⚠️ Carpeta no encontrada:', path);
      return null;
    }

    // Transformar la carpeta para la respuesta
    const transformedFolder = toFolderExtended(folder);

    logger.info('✅ Carpeta encontrada:', { path });
    return transformedFolder;
  } catch (error) {
    logger.error('❌ Error al buscar carpeta por ruta:', error);
    throw new FolderQueryError('No se pudo obtener la carpeta', 'GET_BY_PATH_FAILED', error);
  }
}

/**
 * Busca carpetas por nombre
 */
export async function searchFolders(query: string): Promise<FolderExtended[]> {
  try {
    logger.info('🔍 Buscando carpetas:', query);

    const folders = await prisma.folder.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { path: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        images: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transformar las carpetas para la respuesta
    const transformedFolders = folders.map(toFolderExtended);

    logger.info('✅ Carpetas encontradas:', { count: folders.length, query });
    return transformedFolders;
  } catch (error) {
    logger.error('❌ Error al buscar carpetas:', error);
    throw new FolderQueryError('No se pudo realizar la búsqueda de carpetas', 'SEARCH_FAILED', error);
  }
}

/**
 * Obtiene carpetas sin indexar
 */
export async function getUnindexedFolders(): Promise<FolderExtended[]> {
  const getCachedUnindexedFolders = unstable_cache(
    async () => {
      try {
        logger.info('📋 Obteniendo carpetas sin indexar');

        const folders = await prisma.folder.findMany({
          where: {
            OR: [
              { lastIndexed: null },
              { autoReindex: true },
            ],
          },
          include: {
            images: true,
            _count: {
              select: {
                images: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        // Transformar las carpetas para la respuesta
        const transformedFolders = folders.map(toFolderExtended);

        logger.info('✅ Carpetas sin indexar obtenidas:', { count: folders.length });
        return transformedFolders;
      } catch (error) {
        logger.error('❌ Error al obtener carpetas sin indexar:', error);
        throw new FolderQueryError('No se pudieron obtener las carpetas sin indexar', 'UNINDEXED_FAILED', error);
      }
    },
    ['folders-unindexed'],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: ['folders'],
    }
  );

  return getCachedUnindexedFolders();
}