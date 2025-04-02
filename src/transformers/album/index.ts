/**
 * @file Exportaciones principales de transformers para la entidad Album
 * @module transformers/album
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
    AlbumComplete,
    AlbumCreateInput,
    AlbumSearchOptions,
    AlbumSearchResult,
    AlbumUpdateInput,
} from '@/types/entities/album/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    mapAlbumSearchOptionsToPrisma,
    mapAlbumToRelatedAlbum,
    mapCreateAlbumDataToPrisma,
    mapUpdateAlbumDataToPrisma,
} from './mappers';
import {
    fromPrismaAlbum,
    generateAlbumColor,
    generateAlbumEmoji,
    parseAlbumFilters,
    toPrismaAlbum,
    validateAlbum
} from './serializers';
// Importar el transformador principal y sus funciones asociadas
import {
    transformAlbum as transformAlbumMain,
    transformAlbumToExtended,
    transformAlbumToWithStats,
    transformAlbums as transformAlbumsMain
} from './transformer';

const logger = serverLogger.withContext('AlbumTransformer');

// Exportar el transformador principal y sus variantes
export const transformAlbum = transformAlbumMain;
export const transformAlbums = transformAlbumsMain;
export { transformAlbumToExtended, transformAlbumToWithStats };

/**
 * 🔍 Busca álbumes según los criterios especificados
 */
export async function searchAlbums(options: AlbumSearchOptions): Promise<AlbumSearchResult> {
    try {
        // Mapear opciones de búsqueda a formato Prisma
        const prismaOptions = mapAlbumSearchOptionsToPrisma(options);

        // Realizar búsqueda
        const [items, total] = await Promise.all([
            prisma.album.findMany(prismaOptions),
            prisma.album.count({ where: prismaOptions.where }),
        ]);

        // Deserializar resultados
        const albums = items.map(item => fromPrismaAlbum({
            ...item,
            images: [],
            videos: [],
            collections: [],
            tags: [],
            characters: [],
            places: [],
            worldItems: [],
            concepts: [],
            prompts: [],
            notes: [],
            wildcards: [],
            properties: [],
            groups: [],
            _count: {
                images: 0,
                videos: 0,
                collections: 0,
                tags: 0,
                characters: 0,
                places: 0,
                worldItems: 0,
                concepts: 0,
                prompts: 0,
                notes: 0,
                wildcards: 0,
                properties: 0,
                groups: 0
            }
        }));

        return {
            items: albums,
            total,
            hasMore: total > (options.skip || 0) + items.length,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Obtiene un álbum por su ID
 */
export async function getAlbumById(id: string): Promise<AlbumComplete | null> {
    try {
        const album = await prisma.album.findUnique({
            where: { id },
            include: {
                images: true,
                videos: true,
                collections: true,
                tags: true,
                characters: true,
                places: true,
                worldItems: true,
                concepts: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        if (!album) {
            return null;
        }

        return fromPrismaAlbum(album);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * ✨ Crea un nuevo álbum
 */
export async function createAlbum(data: AlbumCreateInput): Promise<AlbumComplete> {
    try {
        // Validar datos de entrada
        await validateAlbum(data);

        // Serializar datos para Prisma
        const prismaData = toPrismaAlbum(data);

        // Mapear datos a formato Prisma
        const createData = mapCreateAlbumDataToPrisma(data);

        // Crear álbum
        const album = await prisma.album.create({
            data: createData,
            include: {
                images: true,
                videos: true,
                collections: true,
                tags: true,
                characters: true,
                places: true,
                worldItems: true,
                concepts: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        return fromPrismaAlbum(album);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 📝 Actualiza un álbum existente
 */
export async function updateAlbum(id: string, data: AlbumUpdateInput): Promise<AlbumComplete> {
    try {
        // Validar datos de entrada
        await validateAlbum(data);

        // Serializar datos para Prisma
        const prismaData = toPrismaAlbum(data);

        // Mapear datos a formato Prisma
        const updateData = mapUpdateAlbumDataToPrisma(data);

        // Actualizar álbum
        const album = await prisma.album.update({
            where: { id },
            data: updateData,
            include: {
                images: true,
                videos: true,
                collections: true,
                tags: true,
                characters: true,
                places: true,
                worldItems: true,
                concepts: true,
                prompts: true,
                notes: true,
                wildcards: true,
                properties: true,
                groups: true,
                _count: true,
            },
        });

        return fromPrismaAlbum(album);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🗑️ Elimina un álbum
 */
export async function deleteAlbum(id: string): Promise<void> {
    try {
        await prisma.album.delete({
            where: { id },
        });
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Convierte un álbum a su versión relacionada
 */
export function toRelatedAlbum(album: AlbumComplete) {
    try {
        return mapAlbumToRelatedAlbum(album);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Parsea filtros de álbum
 */
export function parseAlbumFilterOptions(filters: unknown) {
    try {
        return parseAlbumFilters(filters);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🎨 Genera un color para el álbum
 */
export function generateAlbumColorFromName(name: string) {
    try {
        return generateAlbumColor(name);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 😀 Genera un emoji para el álbum
 */
export function generateAlbumEmojiFromName(name: string, type?: string) {
    try {
        return generateAlbumEmoji(name, type);
    } catch (error) {
        throw handleTransformerError(error);
    }
}

// Objeto de compatibilidad para código anterior
export const AlbumTransformer = {
    searchAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    toRelatedAlbum,
    parseAlbumFilterOptions,
    // Añadir nuevas funciones al objeto exportado
    transformAlbum,
    transformAlbums,
    transformAlbumToExtended,
    transformAlbumToWithStats
};

export default AlbumTransformer;

