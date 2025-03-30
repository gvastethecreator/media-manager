/**
 * @file Exportaciones principales de transformers para la entidad Album
 * @module transformers/album
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
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
    extendAlbum,
    fromPrismaAlbum,
    generateAlbumColor,
    generateAlbumEmoji,
    parseAlbumFilters,
    toPrismaAlbum,
    validateAlbum,
} from './serializers';

const logger = new Logger('AlbumTransformer');

/**
 * 📁 Transformer para la entidad Album
 */
export class AlbumTransformer {
    /**
     * 🔍 Busca álbumes según los criterios especificados
     */
    static async search(options: AlbumSearchOptions): Promise<AlbumSearchResult> {
        try {
            // Mapear opciones de búsqueda a formato Prisma
            const prismaOptions = mapAlbumSearchOptionsToPrisma(options);

            // Realizar búsqueda
            const [items, total] = await Promise.all([
                prisma.album.findMany(prismaOptions),
                prisma.album.count({ where: prismaOptions.where }),
            ]);

            // Deserializar resultados
            const albums = items.map(item => fromPrismaAlbum(item));

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
    static async getById(id: string): Promise<AlbumComplete | null> {
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
    static async create(data: AlbumCreateInput): Promise<AlbumComplete> {
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
    static async update(id: string, data: AlbumUpdateInput): Promise<AlbumComplete> {
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
    static async delete(id: string): Promise<void> {
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
    static toRelated(album: AlbumComplete) {
        try {
            return mapAlbumToRelatedAlbum(album);
        } catch (error) {
            throw handleTransformerError(error);
        }
    }

    /**
     * 🔍 Parsea filtros de álbum
     */
    static parseFilters(filters: unknown) {
        try {
            return parseAlbumFilters(filters);
        } catch (error) {
            throw handleTransformerError(error);
        }
    }

    /**
     * 🎨 Genera un color para el álbum
     */
    static generateColor(name: string) {
        try {
            return generateAlbumColor(name);
        } catch (error) {
            throw handleTransformerError(error);
        }
    }

    /**
     * 😀 Genera un emoji para el álbum
     */
    static generateEmoji(name: string, type?: string) {
        try {
            return generateAlbumEmoji(name, type);
        } catch (error) {
            throw handleTransformerError(error);
        }
    }
}

// Exportar funciones individuales para uso directo
export {
    extendAlbum,
    fromPrismaAlbum,
    generateAlbumColor,
    generateAlbumEmoji,
    mapAlbumSearchOptionsToPrisma,
    mapAlbumToRelatedAlbum,
    mapCreateAlbumDataToPrisma,
    mapUpdateAlbumDataToPrisma,
    parseAlbumFilters,
    toPrismaAlbum,
    validateAlbum
};

