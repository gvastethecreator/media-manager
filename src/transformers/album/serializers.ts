/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import { Logger } from '@/lib/logger';
import {
    type AlbumCreateInput,
    AlbumSchema,
    type AlbumUpdateInput,
} from '@/types/entities/album/types';
import {
    validateFieldType,
    validateRequiredFields
} from '@/utils/transformers/common';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    getRelationCounts,
    preparePrismaRelations,
    validateEntityRelations,
} from '@/utils/transformers/relations';
import {
    validateBaseEntity,
    validateMetadataFields,
    validateUIFields,
} from '@/utils/transformers/validation';
import type { Prisma } from '@prisma/client';

const logger = new Logger('AlbumSerializer');

/**
 * 🔄 Serializa un Album para Prisma
 */
export function toPrismaAlbum(data: AlbumCreateInput | AlbumUpdateInput): Prisma.AlbumCreateInput | Prisma.AlbumUpdateInput {
    try {
        // Validar campos requeridos para creación
        if (!('id' in data)) {
            validateRequiredFields(data, ['name']);
        }

        // Validar tipos de datos
        validateFieldType(data.name, 'string', 'name');
        if (data.emoji) validateFieldType(data.emoji, 'string', 'emoji');
        if (data.color) validateFieldType(data.color, 'string', 'color');
        if (data.category) validateFieldType(data.category, 'string', 'category');
        if (data.type) validateFieldType(data.type, 'string', 'type');

        // Preparar relaciones para Prisma
        const relations = preparePrismaRelations('Album', data);

        return {
            ...data,
            ...relations,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Deserializa un Album desde Prisma
 */
export function fromPrismaAlbum(
    prismaAlbum: Prisma.AlbumGetPayload<{
        include: {
            images: true;
            videos: true;
            collections: true;
            tags: true;
            characters: true;
            places: true;
            worldItems: true;
            concepts: true;
            prompts: true;
            notes: true;
            wildcards: true;
            properties: true;
            groups: true;
            _count: true;
        };
    }>
): AlbumComplete {
    try {
        // Obtener conteos de relaciones
        const counts = getRelationCounts('Album', prismaAlbum);

        // Construir objeto base
        const baseAlbum: AlbumBase = {
            id: prismaAlbum.id,
            name: prismaAlbum.name,
            emoji: prismaAlbum.emoji,
            color: prismaAlbum.color,
            description: prismaAlbum.description,
            shortcut: prismaAlbum.shortcut,
            category: prismaAlbum.category,
            type: prismaAlbum.type,
            sortBy: prismaAlbum.sortBy,
            filters: prismaAlbum.filters,
            featuredImage: prismaAlbum.featuredImage,
            isFavorite: prismaAlbum.isFavorite,
            isPublic: prismaAlbum.isPublic,
            settings: prismaAlbum.settings,
            metadata: prismaAlbum.metadata,
            createdAt: prismaAlbum.createdAt,
            updatedAt: prismaAlbum.updatedAt,
        };

        // Validar objeto base
        validateBaseEntity(baseAlbum);
        validateUIFields(baseAlbum);
        validateMetadataFields(baseAlbum);

        // Construir objeto completo con relaciones
        return {
            ...baseAlbum,
            images: prismaAlbum.images?.map(img => ({ id: img.id })),
            videos: prismaAlbum.videos?.map(vid => ({ id: vid.id })),
            collections: prismaAlbum.collections?.map(col => ({ id: col.id })),
            tags: prismaAlbum.tags?.map(tag => ({ id: tag.id })),
            characters: prismaAlbum.characters?.map(char => ({ id: char.id })),
            places: prismaAlbum.places?.map(place => ({ id: place.id })),
            worldItems: prismaAlbum.worldItems?.map(item => ({ id: item.id })),
            concepts: prismaAlbum.concepts?.map(con => ({ id: con.id })),
            prompts: prismaAlbum.prompts?.map(prompt => ({ id: prompt.id })),
            notes: prismaAlbum.notes?.map(note => ({ id: note.id })),
            wildcards: prismaAlbum.wildcards?.map(wild => ({ id: wild.id })),
            properties: prismaAlbum.properties?.map(prop => ({ id: prop.id })),
            groups: prismaAlbum.groups?.map(group => ({ id: group.id })),
            _count: counts,
        };
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Valida un Album
 */
export function validateAlbum(data: unknown): AlbumComplete {
    try {
        const validated = AlbumSchema.parse(data);
        validateEntityRelations('Album', validated);
        return validated as AlbumComplete;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Extiende un Album con datos adicionales
 */
export async function extendAlbum(
    album: AlbumComplete,
    options: {
        includeRelations?: boolean;
        includeCount?: boolean;
        customFields?: string[];
    } = {}
): Promise<AlbumComplete> {
    try {
        const extended = { ...album };

        // Aquí puedes agregar lógica para cargar datos adicionales
        // basado en las opciones proporcionadas

        return extended;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔍 Parsea filtros de Album
 */
export function parseAlbumFilters(filters: unknown): Record<string, unknown> {
    try {
        if (!filters || typeof filters !== 'object') {
            return {};
        }

        const parsed: Record<string, unknown> = {};
        const typedFilters = filters as Record<string, unknown>;

        // Procesar filtros específicos de Album
        if (typedFilters.search) {
            parsed.OR = [
                { name: { contains: typedFilters.search as string, mode: 'insensitive' } },
                { description: { contains: typedFilters.search as string, mode: 'insensitive' } },
            ];
        }

        // Filtros de categoría
        if (typedFilters.categories?.length) {
            parsed.category = { in: typedFilters.categories };
        }

        // Filtros de tipo
        if (typedFilters.types?.length) {
            parsed.type = { in: typedFilters.types };
        }

        // Filtros de estado
        if (typedFilters.isFavorite !== undefined) {
            parsed.isFavorite = typedFilters.isFavorite;
        }
        if (typedFilters.isPublic !== undefined) {
            parsed.isPublic = typedFilters.isPublic;
        }

        // Filtros de relaciones
        if (typedFilters.hasImages) {
            parsed.images = { some: {} };
        }
        if (typedFilters.hasVideos) {
            parsed.videos = { some: {} };
        }
        if (typedFilters.hasCollections) {
            parsed.collections = { some: {} };
        }

        // Filtros de cantidad de items
        if (typedFilters.minItems !== undefined) {
            parsed._count = {
                ...parsed._count,
                images: { gte: typedFilters.minItems },
            };
        }
        if (typedFilters.maxItems !== undefined) {
            parsed._count = {
                ...parsed._count,
                images: { lte: typedFilters.maxItems },
            };
        }

        // Filtros de fecha
        if (typedFilters.dateRange?.start) {
            parsed.createdAt = { ...parsed.createdAt, gte: typedFilters.dateRange.start };
        }
        if (typedFilters.dateRange?.end) {
            parsed.createdAt = { ...parsed.createdAt, lte: typedFilters.dateRange.end };
        }

        return parsed;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * Genera un color por defecto basado en el nombre del álbum
 * @param name Nombre del álbum
 * @returns Color en formato hexadecimal
 */
export function generateAlbumColor(name: string): string {
    if (!name) return '#3b82f6'; // Azul por defecto

    // Generar un hash del nombre
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convertir a color hexadecimal
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
}

/**
 * Genera un emoji basado en el nombre o tipo del álbum
 * @param name Nombre del álbum
 * @param type Tipo del álbum
 * @returns Emoji representativo
 */
export function generateAlbumEmoji(name: string, type?: string): string {
    // Mapeo de tipos a emojis
    const typeEmojis: Record<string, string> = {
        'gallery': '🖼️',
        'collection': '📁',
        'event': '📅',
        'project': '📋',
        'portfolio': '💼',
        'favorites': '⭐',
        'archive': '📦',
        'custom': '📎',
        'other': '📌',
    };

    // Si hay tipo y está en el mapeo, usar ese emoji
    if (type && typeEmojis[type.toLowerCase()]) {
        return typeEmojis[type.toLowerCase()];
    }

    // Análisis básico del nombre para decidir un emoji
    const lowerName = name.toLowerCase();

    if (lowerName.includes('gallery') || lowerName.includes('photos')) return '🖼️';
    if (lowerName.includes('collection') || lowerName.includes('set')) return '📁';
    if (lowerName.includes('event') || lowerName.includes('party')) return '📅';
    if (lowerName.includes('project') || lowerName.includes('work')) return '📋';
    if (lowerName.includes('portfolio') || lowerName.includes('showcase')) return '💼';
    if (lowerName.includes('favorite') || lowerName.includes('best')) return '⭐';
    if (lowerName.includes('archive') || lowerName.includes('backup')) return '📦';

    // Emoji por defecto
    return '📁';
}
