/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    type AlbumComplete,
    type AlbumCreateInput,
    AlbumSchema,
    type AlbumUpdateInput
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
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('AlbumSerializer');

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

        // Ajustar los campos para alinear con el schema.prisma
        // Remover los campos que no están en el schema actual
        const sanitizedData: Record<string, any> = { ...data };

        // Usar la técnica de filtrado sin delete para evitar problemas de rendimiento
        const fieldsToRemove = ['type', 'isPublic', 'settings', 'metadata'];
        const sanitizedResult = Object.fromEntries(
            Object.entries(sanitizedData).filter(([key]) => !fieldsToRemove.includes(key))
        );

        // Preparar relaciones para Prisma
        const relations = preparePrismaRelations('Album', data);

        // Devolver el objeto tipado como se espera
        return {
            ...sanitizedResult,
            ...relations,
        } as Prisma.AlbumCreateInput | Prisma.AlbumUpdateInput;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * 🔄 Deserializa un Album desde Prisma
 */
export function fromPrismaAlbum(
    prismaAlbum: Partial<Prisma.AlbumGetPayload<{
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
    }>>
): AlbumComplete {
    try {
        // Asegurarse de que los campos base esenciales existan
        if (!prismaAlbum || !prismaAlbum.id || typeof prismaAlbum.name !== 'string') { // Añadir chequeo de tipo para name
            logger.error('Invalid prismaAlbum object received in fromPrismaAlbum', { prismaAlbum });
            throw new Error('Invalid prismaAlbum object received in fromPrismaAlbum');
        }

        // Obtener conteos de relaciones (asumiendo que getRelationCounts maneja Partial)
        const counts = getRelationCounts('Album', prismaAlbum);

        // Construir objeto base usando nullish coalescing para defaults
        const baseAlbum = {
            id: prismaAlbum.id,
            name: prismaAlbum.name, // Ya validado tipo string
            emoji: prismaAlbum.emoji ?? '',
            color: prismaAlbum.color ?? '',
            description: prismaAlbum.description ?? null,
            shortcut: prismaAlbum.shortcut ?? null,
            category: prismaAlbum.category ?? '',
            sortBy: prismaAlbum.sortBy ?? '',
            filters: prismaAlbum.filters ?? '', // Asumir que 'filters' es string o null/undefined
            featuredImage: prismaAlbum.featuredImage ?? null,
            isFavorite: prismaAlbum.isFavorite ?? false,
            // Manejar fechas que pueden ser string o Date
            createdAt: prismaAlbum.createdAt ? new Date(prismaAlbum.createdAt) : new Date(0), // Default a epoch si falta
            updatedAt: prismaAlbum.updatedAt ? new Date(prismaAlbum.updatedAt) : new Date(0), // Default a epoch si falta
        };

        // Validar campos base si es necesario (puede ser opcional dependiendo de la confianza en los datos)
        // validateBaseEntity(baseAlbum);
        // validateUIFields(baseAlbum);
        // validateMetadataFields(baseAlbum);

        // Construir objeto completo con relaciones usando optional chaining y nullish coalescing
        return {
            ...baseAlbum,
            images: prismaAlbum.images?.map(img => ({ id: img.id })) ?? [],
            videos: prismaAlbum.videos?.map(vid => ({ id: vid.id })) ?? [],
            collections: prismaAlbum.collections?.map(col => ({ id: col.id })) ?? [],
            tags: prismaAlbum.tags?.map(tag => ({ id: tag.id })) ?? [],
            characters: prismaAlbum.characters?.map(char => ({ id: char.id })) ?? [],
            places: prismaAlbum.places?.map(place => ({ id: place.id })) ?? [],
            worldItems: prismaAlbum.worldItems?.map(item => ({ id: item.id })) ?? [],
            concepts: prismaAlbum.concepts?.map(con => ({ id: con.id })) ?? [],
            prompts: prismaAlbum.prompts?.map(prompt => ({ id: prompt.id })) ?? [],
            notes: prismaAlbum.notes?.map(note => ({ id: note.id })) ?? [],
            wildcards: prismaAlbum.wildcards?.map(wild => ({ id: wild.id })) ?? [],
            properties: prismaAlbum.properties?.map(prop => ({ id: prop.id })) ?? [],
            groups: prismaAlbum.groups?.map(group => ({ id: group.id })) ?? [],
            _count: counts, // Usar counts de getRelationCounts
        };
    } catch (error) {
        // Loguear el error con más contexto si es posible
        logger.error(`Error in fromPrismaAlbum for ID ${prismaAlbum?.id ?? 'unknown'}`, {
             error: error instanceof Error ? { name: error.name, message: error.message, cause: error.cause } : error
        });
        // Re-lanzar el error consistentemente
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
        if (typedFilters.categories && Array.isArray(typedFilters.categories) && typedFilters.categories.length) {
            parsed.category = { in: typedFilters.categories };
        }

        // Filtros de estado
        if (typedFilters.isFavorite !== undefined) {
            parsed.isFavorite = typedFilters.isFavorite;
        }

        // Eliminar filtros que no están en el schema actual
        const fieldsToRemove = ['isPublic', 'types'];
        const filteredParsed = Object.fromEntries(
            Object.entries(parsed).filter(([key]) => !fieldsToRemove.includes(key))
        );

        // Filtros de relaciones
        if (typedFilters.hasImages) {
            filteredParsed.images = { some: {} };
        }
        if (typedFilters.hasVideos) {
            filteredParsed.videos = { some: {} };
        }
        if (typedFilters.hasCollections) {
            filteredParsed.collections = { some: {} };
        }

        // Filtros de cantidad de items
        if (typedFilters.minItems !== undefined) {
            filteredParsed._count = {
                ...(filteredParsed._count as Record<string, unknown> || {}),
                images: { gte: typedFilters.minItems },
            };
        }
        if (typedFilters.maxItems !== undefined) {
            filteredParsed._count = {
                ...(filteredParsed._count as Record<string, unknown> || {}),
                images: { lte: typedFilters.maxItems },
            };
        }

        // Filtros de fecha
        const dateRange = typedFilters.dateRange as Record<string, unknown> | undefined;
        if (dateRange?.start) {
            filteredParsed.createdAt = {
                ...(filteredParsed.createdAt as Record<string, unknown> || {}),
                gte: dateRange.start
            };
        }
        if (dateRange?.end) {
            filteredParsed.createdAt = {
                ...(filteredParsed.createdAt as Record<string, unknown> || {}),
                lte: dateRange.end
            };
        }

        return filteredParsed;
    } catch (error) {
        throw handleTransformerError(error);
    }
}

/**
 * Genera un color por defecto basado en el nombre del álbum
 */
export function generateAlbumColor(name: string): string {
    try {
        if (!name) return '#3b82f6'; // Color por defecto

        // Inicializar componentes RGB
        let r = 0;
        let g = 0;
        let b = 0;

        // Generar color basado en el nombre
        for (let i = 0; i < name.length; i++) {
            const charCode = name.charCodeAt(i);
            if (i % 3 === 0) r = (r + charCode) % 200 + 55; // Mantener entre 55-255
            if (i % 3 === 1) g = (g + charCode) % 200 + 55;
            if (i % 3 === 2) b = (b + charCode) % 200 + 55;
        }

        // Convertir a formato hexadecimal
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
        logger.error('Error generando color para álbum', { name, error });
        return '#3b82f6'; // Color por defecto en caso de error
    }
}

/**
 * Genera un emoji por defecto basado en el nombre y tipo del álbum
 */
export function generateAlbumEmoji(name: string, type?: string): string {
    try {
        // Emojis por categoría
        const categoryEmojis: Record<string, string[]> = {
            default: ['📁', '📂', '📑', '🗃️', '🗄️', '📚', '📒', '📓', '📔', '📕', '📗', '📘', '📙'],
            art: ['🎨', '🖌️', '🖼️', '🧩', '🪄', '🎭', '🎪'],
            photo: ['📸', '📷', '🏞️', '📱', '📹', '📽️', '🎬'],
            media: ['🎵', '🎧', '📺', '🎥', '🎞️', '🎬', '🎮'],
            nature: ['🌿', '🌳', '🌲', '🌱', '🍀', '🌺', '🌻', '🦋'],
            travel: ['✈️', '🗺️', '🧳', '🏖️', '🏝️', '🏔️', '🏰'],
            food: ['🍎', '🍕', '🍰', '🍩', '🍪', '🍷', '🍴'],
        };

        let selectedCategory = 'default';

        // Determinar categoría basada en el tipo o nombre
        if (type) {
            const lowerType = type.toLowerCase();
            for (const [category, _] of Object.entries(categoryEmojis)) {
                if (lowerType.includes(category)) {
                    selectedCategory = category;
                    break;
                }
            }
        } else if (name) {
            const lowerName = name.toLowerCase();
            for (const [category, _] of Object.entries(categoryEmojis)) {
                if (lowerName.includes(category)) {
                    selectedCategory = category;
                    break;
                }
            }
        }

        // Seleccionar emoji aleatorio de la categoría
        const emojis = categoryEmojis[selectedCategory] || categoryEmojis.default;
        const randomIndex = Math.floor(Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % emojis.length);

        return emojis[randomIndex];
    } catch (error) {
        logger.error('Error generando emoji para álbum', { name, type, error });
        return '📁'; // Emoji por defecto en caso de error
    }
}
