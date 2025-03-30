/**
 * @file Funciones de mapeo para la entidad Album
 * @module transformers/album/mappers
 */

import { Logger } from '@/lib/logger';
import {
    AlbumCreateInput,
    AlbumFilters,
    AlbumSearchOptions,
    AlbumUpdateInput,
} from '@/types/entities/album/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import { Prisma } from '@prisma/client';

const logger = new Logger('AlbumMapper');

/**
 * 🔄 Mapea datos de creación de Album a formato Prisma
 */
export function mapCreateAlbumDataToPrisma(data: AlbumCreateInput): Prisma.AlbumCreateInput {
    try {
        // Preparar datos base
        const baseData = {
            name: data.name,
            emoji: data.emoji || '📁',
            color: data.color || '#3b82f6',
            description: data.description,
            shortcut: data.shortcut,
            category: data.category || 'general',
            type: data.type || 'gallery',
            sortBy: data.sortBy || 'name',
            filters: data.filters || '{}',
            featuredImage: data.featuredImage,
            isFavorite: data.isFavorite || false,
            isPublic: data.isPublic || false,
            settings: data.settings || '{}',
            metadata: data.metadata,
        };

        // Preparar relaciones
        const relations = {
            images: data.images?.length ? { connect: data.images.map(img => ({ id: img.id })) } : undefined,
            videos: data.videos?.length ? { connect: data.videos.map(vid => ({ id: vid.id })) } : undefined,
            collections: data.collections?.length ? { connect: data.collections.map(col => ({ id: col.id })) } : undefined,
            tags: data.tags?.length ? { connect: data.tags.map(tag => ({ id: tag.id })) } : undefined,
            characters: data.characters?.length ? { connect: data.characters.map(char => ({ id: char.id })) } : undefined,
            places: data.places?.length ? { connect: data.places.map(place => ({ id: place.id })) } : undefined,
            worldItems: data.worldItems?.length ? { connect: data.worldItems.map(item => ({ id: item.id })) } : undefined,
            concepts: data.concepts?.length ? { connect: data.concepts.map(con => ({ id: con.id })) } : undefined,
            prompts: data.prompts?.length ? { connect: data.prompts.map(prompt => ({ id: prompt.id })) } : undefined,
            notes: data.notes?.length ? { connect: data.notes.map(note => ({ id: note.id })) } : undefined,
            wildcards: data.wildcards?.length ? { connect: data.wildcards.map(wild => ({ id: wild.id })) } : undefined,
            properties: data.properties?.length ? { connect: data.properties.map(prop => ({ id: prop.id })) } : undefined,
            groups: data.groups?.length ? { connect: data.groups.map(group => ({ id: group.id })) } : undefined,
        };

        return {
            ...baseData,
            ...relations,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Mapea datos de actualización de Album a formato Prisma
 */
export function mapUpdateAlbumDataToPrisma(data: AlbumUpdateInput): Prisma.AlbumUpdateInput {
    try {
        // Preparar datos base
        const baseData = {
            name: data.name,
            emoji: data.emoji,
            color: data.color,
            description: data.description,
            shortcut: data.shortcut,
            category: data.category,
            type: data.type,
            sortBy: data.sortBy,
            filters: data.filters,
            featuredImage: data.featuredImage,
            isFavorite: data.isFavorite,
            isPublic: data.isPublic,
            settings: data.settings,
            metadata: data.metadata,
            updatedAt: new Date(),
        };

        // Preparar relaciones
        const relations = {
            images: data.images?.length ? { set: data.images.map(img => ({ id: img.id })) } : undefined,
            videos: data.videos?.length ? { set: data.videos.map(vid => ({ id: vid.id })) } : undefined,
            collections: data.collections?.length ? { set: data.collections.map(col => ({ id: col.id })) } : undefined,
            tags: data.tags?.length ? { set: data.tags.map(tag => ({ id: tag.id })) } : undefined,
            characters: data.characters?.length ? { set: data.characters.map(char => ({ id: char.id })) } : undefined,
            places: data.places?.length ? { set: data.places.map(place => ({ id: place.id })) } : undefined,
            worldItems: data.worldItems?.length ? { set: data.worldItems.map(item => ({ id: item.id })) } : undefined,
            concepts: data.concepts?.length ? { set: data.concepts.map(con => ({ id: con.id })) } : undefined,
            prompts: data.prompts?.length ? { set: data.prompts.map(prompt => ({ id: prompt.id })) } : undefined,
            notes: data.notes?.length ? { set: data.notes.map(note => ({ id: note.id })) } : undefined,
            wildcards: data.wildcards?.length ? { set: data.wildcards.map(wild => ({ id: wild.id })) } : undefined,
            properties: data.properties?.length ? { set: data.properties.map(prop => ({ id: prop.id })) } : undefined,
            groups: data.groups?.length ? { set: data.groups.map(group => ({ id: group.id })) } : undefined,
        };

        return {
            ...baseData,
            ...relations,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Mapea opciones de búsqueda de Album a formato Prisma
 */
export function mapAlbumSearchOptionsToPrisma(
    options: AlbumSearchOptions
): Prisma.AlbumFindManyArgs {
    try {
        const { skip = 0, take = DEFAULT_PAGE_SIZE, orderBy, where = {}, include = {} } = options;

        // Validar y ajustar el tamaño de página
        const validatedPageSize = Math.min(take, MAX_PAGE_SIZE);

        // Mapear ordenamiento
        const orderByMapped = orderBy ? {
            [orderBy.field]: orderBy.direction,
        } : { createdAt: 'desc' };

        // Mapear filtros
        const whereMapped = mapAlbumFiltersToPrisma(where);

        // Mapear inclusiones
        const includeRelations = {
            images: include.images ?? false,
            videos: include.videos ?? false,
            collections: include.collections ?? false,
            tags: include.tags ?? false,
            characters: include.characters ?? false,
            places: include.places ?? false,
            worldItems: include.worldItems ?? false,
            concepts: include.concepts ?? false,
            prompts: include.prompts ?? false,
            notes: include.notes ?? false,
            wildcards: include.wildcards ?? false,
            properties: include.properties ?? false,
            groups: include.groups ?? false,
            _count: true,
        };

        return {
            skip,
            take: validatedPageSize,
            orderBy: orderByMapped,
            where: whereMapped,
            include: includeRelations,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Mapea filtros de Album a formato Prisma
 */
export function mapAlbumFiltersToPrisma(filters: AlbumFilters): Prisma.AlbumWhereInput {
    try {
        const where: Prisma.AlbumWhereInput = {};

        // Filtros de texto
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Filtros de categoría
        if (filters.categories?.length) {
            where.category = { in: filters.categories };
        }

        // Filtros de tipo
        if (filters.types?.length) {
            where.type = { in: filters.types };
        }

        // Filtros de estado
        if (filters.isFavorite !== undefined) {
            where.isFavorite = filters.isFavorite;
        }
        if (filters.isPublic !== undefined) {
            where.isPublic = filters.isPublic;
        }

        // Filtros de relaciones
        if (filters.hasImages) {
            where.images = { some: {} };
        }
        if (filters.hasVideos) {
            where.videos = { some: {} };
        }
        if (filters.hasCollections) {
            where.collections = { some: {} };
        }

        // Filtros de cantidad de items
        if (filters.minItems !== undefined) {
            where._count = {
                ...where._count,
                images: { gte: filters.minItems },
            };
        }
        if (filters.maxItems !== undefined) {
            where._count = {
                ...where._count,
                images: { lte: filters.maxItems },
            };
        }

        // Filtros de fecha
        if (filters.dateRange?.start) {
            where.createdAt = { ...where.createdAt, gte: filters.dateRange.start };
        }
        if (filters.dateRange?.end) {
            where.createdAt = { ...where.createdAt, lte: filters.dateRange.end };
        }

        return where;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Mapea un Album a su versión relacionada
 */
export function mapAlbumToRelatedAlbum(album: AlbumComplete): { id: string } {
    try {
        return { id: album.id };
    } catch (error) {
        throw handleTransformerError(error);
    }
}
