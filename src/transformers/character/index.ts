/**
 * @file Transformer para la entidad Character
 * @module transformers/character
 */

import { EntityError, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
    CharacterCreateInput,
    CharacterExtended,
    CharacterSearchResult,
    CharacterUpdateInput
} from '@/types/entities/character';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/utils/transformers/constants';
import { TransformerError, ValidationError } from '@/utils/transformers/errors';
import { toCharacterListItem } from './mappers';
import { parseCharacterFilterObject, serializeObject, toExtendedCharacter, toPrismaCharacter, validateCharacter } from './serializers';

// Clase para representar error de entidad no encontrada
class NotFoundError extends EntityError {
    constructor(message: string) {
        super(message, EntityErrorCode.NOT_FOUND);
        this.name = 'NotFoundError';
    }
}

const logger = serverLogger.withContext('CharacterTransformer');

/**
 * Busca personajes según los filtros proporcionados
 */
export async function searchCharacters(
    filters: Record<string, any> = {},
    options: {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeInactive?: boolean;
    } = {}
): Promise<CharacterSearchResult> {
    try {
        const {
            page = 1,
            pageSize = DEFAULT_PAGE_SIZE,
            sortBy = 'name',
            sortOrder = 'asc',
            includeInactive = false,
        } = options;

        // Limitar el tamaño de página
        const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);

        // Calcular offset para paginación
        const skip = (page - 1) * limitedPageSize;

        // Parsear filtros
        const parsedFilters = parseCharacterFilterObject(filters);

        // Agregar filtro para incluir/excluir inactivos
        if (!includeInactive) {
            parsedFilters.isActive = true;
        }

        // Ordenación
        const orderBy = { [sortBy]: sortOrder };

        // Ejecutar consulta
        const [characters, totalCount] = await Promise.all([
            prisma.character.findMany({
                where: parsedFilters,
                orderBy,
                skip,
                take: limitedPageSize,
            }),
            prisma.character.count({
                where: parsedFilters,
            }),
        ]);

        // Calcular metadata de paginación
        const totalPages = Math.ceil(totalCount / limitedPageSize);
        const hasMore = page < totalPages;

        // Mapear resultados
        const items = characters.map(toCharacterListItem);

        return {
            items,
            pagination: {
                page,
                pageSize: limitedPageSize,
                totalItems: totalCount,
                totalPages,
                hasMore,
            },
        } as CharacterSearchResult;
    } catch (error) {
        logger.error('Error buscando personajes:', error);
        throw new TransformerError('Error al buscar personajes');
    }
}

/**
 * Obtiene un personaje por su ID
 */
export async function getCharacterById(
    id: string,
    options: {
        includeRelations?: boolean;
        throwIfNotFound?: boolean;
    } = {}
): Promise<CharacterExtended | null> {
    try {
        const { includeRelations = false, throwIfNotFound = true } = options;

        // Construir opciones de inclusión de relaciones
        const include = includeRelations ? {
            images: true,
            _count: {
                select: {
                    images: true,
                    notes: true,
                    concepts: true,
                    worldItems: true,
                },
            },
        } : undefined;

        // Buscar personaje
        const character = await prisma.character.findUnique({
            where: { id },
            include,
        });

        // Si no existe y se debe lanzar error
        if (!character && throwIfNotFound) {
            throw new NotFoundError(`Personaje con ID ${id} no encontrado`);
        }

        // Si no existe, devolver null
        if (!character) {
            return null;
        }

        // Transformar a formato extendido
        return toExtendedCharacter(character);
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(`Error obteniendo personaje ${id}:`, error);
        throw new TransformerError(`Error al obtener personaje ${id}`);
    }
}

/**
 * Obtiene varios personajes por sus IDs
 */
export async function getCharactersByIds(
    ids: string[],
    options: {
        includeRelations?: boolean;
    } = {}
): Promise<CharacterExtended[]> {
    try {
        const { includeRelations = false } = options;

        // Si no hay IDs, devolver array vacío
        if (!ids.length) {
            return [];
        }

        // Construir opciones de inclusión de relaciones
        const include = includeRelations
            ? {
                images: true,
                _count: {
                    select: {
                        images: true,
                        notes: true,
                    },
                },
            }
            : undefined;

        // Buscar personajes
        const characters = await prisma.character.findMany({
            where: {
                id: { in: ids },
            },
            include,
        });

        // Transformar a formato extendido
        return characters.map(character => toExtendedCharacter(character));
    } catch (error) {
        logger.error('Error obteniendo personajes por IDs:', error);
        throw new TransformerError('Error al obtener personajes por IDs', { cause: error });
    }
}

/**
 * Crea un nuevo personaje
 */
export async function createCharacter(
    data: CharacterCreateInput
): Promise<CharacterExtended> {
    try {
        // Validar datos
        validateCharacter(data);

        // Transformar a formato Prisma
        const prismaData = toPrismaCharacter(data);

        // Crear personaje
        const character = await prisma.character.create({
            data: prismaData,
        });

        // Transformar a formato extendido
        return toExtendedCharacter(character);
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        logger.error('Error creando personaje:', error);
        throw new TransformerError('Error al crear personaje');
    }
}

/**
 * Actualiza un personaje existente
 */
export async function updateCharacter(
    id: string,
    data: CharacterUpdateInput
): Promise<CharacterExtended> {
    try {
        // Verificar que el personaje existe
        const exists = await prisma.character.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!exists) {
            throw new NotFoundError(`Personaje con ID ${id} no encontrado`);
        }

        // Transformar a formato Prisma
        const prismaData = toPrismaCharacter(data as any); // Usar any temporalmente para solucionar error de tipado

        // Actualizar personaje
        const updated = await prisma.character.update({
            where: { id },
            data: prismaData,
        });

        // Transformar a formato extendido
        return toExtendedCharacter(updated);
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(`Error actualizando personaje ${id}:`, error);
        throw new TransformerError(`Error al actualizar personaje ${id}`);
    }
}

/**
 * Elimina un personaje existente
 */
export async function deleteCharacter(
    id: string,
    options: {
        softDelete?: boolean;
    } = {}
): Promise<boolean> {
    try {
        const { softDelete = true } = options;

        // Verificar que el personaje existe
        const exists = await prisma.character.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!exists) {
            throw new NotFoundError(`Personaje con ID ${id} no encontrado`);
        }

        if (softDelete) {
            // Soft delete (marcar como inactivo)
            await prisma.character.update({
                where: { id },
                data: {
                    isActive: false,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Hard delete (eliminar de la base de datos)
            await prisma.character.delete({
                where: { id },
            });
        }

        return true;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(`Error eliminando personaje ${id}:`, error);
        throw new TransformerError(`Error al eliminar personaje ${id}`);
    }
}

/**
 * Parsea opciones de filtro para personajes
 */
export function parseCharacterFilterOptions(
    options: Record<string, any> = {}
): Record<string, any> {
    try {
        const filters: Record<string, any> = {};

        // Filtro de búsqueda por texto
        if (options.search) {
            filters.OR = [
                { name: { contains: options.search, mode: 'insensitive' } },
                { description: { contains: options.search, mode: 'insensitive' } },
            ];
        }

        // Filtros por propiedades exactas
        const exactProperties = ['class', 'race', 'alignment', 'background'];
        exactProperties.forEach(prop => {
            if (options[prop]) {
                filters[prop] = options[prop];
            }
        });

        // Filtros de rango numérico
        if (options.minLevel !== undefined) {
            filters.level = { ...filters.level, gte: parseInt(options.minLevel) };
        }

        if (options.maxLevel !== undefined) {
            filters.level = { ...filters.level, lte: parseInt(options.maxLevel) };
        }

        // Filtros booleanos
        if (options.favorite !== undefined) {
            filters.favorite = options.favorite === 'true' || options.favorite === true;
        }

        if (options.active !== undefined) {
            filters.isActive = options.active === 'true' || options.active === true;
        }

        return filters;
    } catch (error) {
        logger.error('Error parseando opciones de filtro:', error);
        return {};
    }
}

/**
 * Convierte un personaje a un formato relacionado (para asociaciones)
 */
export function toRelatedCharacter(
    character: Record<string, any>,
    options: {
        includeDetails?: boolean;
    } = {}
): Record<string, any> {
    try {
        const { includeDetails = false } = options;

        if (!character) {
            return null;
        }

        if (!includeDetails) {
            // Versión básica con solo ID y nombre
            return {
                id: character.id,
                name: character.name,
                type: 'character',
            };
        }

        // Versión detallada con más propiedades
        return {
            id: character.id,
            name: character.name,
            type: 'character',
            class: character.class,
            race: character.race,
            level: character.level,
            description: character.description || '',
        };
    } catch (error) {
        logger.error('Error convirtiendo a personaje relacionado:', error);
        return { id: character.id, name: character.name || 'Error', type: 'character' };
    }
}

/**
 * Obtiene una apariencia sugerida por clase de personaje
 * @param characterClass Clase de personaje (warrior, mage, etc)
 * @returns Objeto con color y emoji sugeridos
 */
export function getSuggestedAppearance(characterClass = 'warrior'): { color: string, emoji: string } {
  try {
    // Proporcionamos un implementación básica para satisfacer la referencia
    const validClass = characterClass?.toLowerCase() || 'warrior';

    // Valores por defecto
    return {
      color: '#3b82f6',
      emoji: '👤'
    };
  } catch (error) {
    logger.error('Error al obtener apariencia sugerida', { error });
    return { color: '#3b82f6', emoji: '👤' };
  }
}

// Exportar la función serializeObject desde serializers.ts
export { serializeObject };

// Exportar funciones individualmente y como compatibilidad con la API anterior
export default {
    searchCharacters,
    getCharacterById,
    getCharactersByIds,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    parseCharacterFilterOptions,
    toRelatedCharacter,
    getSuggestedAppearance,
    serializeObject
};
