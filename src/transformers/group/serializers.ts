/**
 * @file Funciones para serializar y deserializar datos de grupos
 * @module transformers/group/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    type GroupBase,
    type GroupComplete,
    type GroupCreateInput,
    GroupSchema,
    type GroupTransformerOptions,
    type GroupUpdateInput
} from '@/types/entities/group/types';
import {
    deserializeJsonField,
    serializeJsonField,
    validateFieldType,
    validateRequiredFields,
} from '@/utils/transformers/common';
import { DEFAULT_UI_VALUES } from '@/utils/transformers/constants';
import {
    handleTransformerError
} from '@/utils/transformers/errors';
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

const logger = serverLogger.withContext('GroupSerializer');

// Constantes para valores por defecto
export const DEFAULT_GROUP_EMOJI = '📂';
export const DEFAULT_GROUP_COLOR = '#3b82f6';

/**
 * 🔄 Serializa un Group para Prisma
 */
export function toPrismaGroup(data: GroupCreateInput | GroupUpdateInput): Prisma.GroupCreateInput | Prisma.GroupUpdateInput {
  try {
    // Validar campos requeridos para creación
    if (!('id' in data)) {
      validateRequiredFields(data, ['name', 'emoji', 'color']);
    }

    // Validar tipos de datos
    validateFieldType(data.name, 'string', 'name');
    validateFieldType(data.emoji, 'string', 'emoji');
    validateFieldType(data.color, 'string', 'color');

    // Serializar campos JSON
    const filters = serializeJsonField(data.filters, '{}');

    // Preparar resultado
    const result: Record<string, any> = {
      ...data,
      filters,
    };

    // Convertir isFavorite a favorite si está presente
    if ('isFavorite' in data) {
      result.favorite = data.isFavorite;
      result.isFavorite = undefined;
    }

    // Preparar relaciones para Prisma
    const relations = preparePrismaRelations('Group', data);
    Object.assign(result, relations);

    return result as Prisma.GroupCreateInput | Prisma.GroupUpdateInput;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Deserializa un Group desde Prisma
 */
export function fromPrismaGroup(
  prismaGroup: Prisma.GroupGetPayload<{
    include: {
      images: true;
      videos: true;
      albums: true;
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
      _count: true;
    };
  }>
): GroupComplete {
  try {
    // Deserializar campos JSON
    const filters = deserializeJsonField(prismaGroup.filters, {});

    // Obtener conteos de relaciones
    const counts = getRelationCounts('Group', prismaGroup);

    // Construir objeto base
    const baseGroup: GroupBase = {
      id: prismaGroup.id,
      name: prismaGroup.name,
      emoji: prismaGroup.emoji || DEFAULT_UI_VALUES.emoji,
      color: prismaGroup.color || DEFAULT_UI_VALUES.color,
      description: prismaGroup.description,
      shortcut: prismaGroup.shortcut,
      category: prismaGroup.category,
      sortBy: prismaGroup.sortBy,
      filters,
      featuredImage: prismaGroup.featuredImage,
      isFavorite: prismaGroup.favorite || false,
      createdAt: prismaGroup.createdAt,
      updatedAt: prismaGroup.updatedAt,
    };

    // Validar objeto base
    validateBaseEntity(baseGroup);
    validateUIFields(baseGroup);
    validateMetadataFields(baseGroup);

    // Construir objeto completo con relaciones
    return {
      ...baseGroup,
      images: prismaGroup.images?.map(img => ({ id: img.id })),
      videos: prismaGroup.videos?.map(vid => ({ id: vid.id })),
      albums: prismaGroup.albums?.map(alb => ({ id: alb.id })),
      collections: prismaGroup.collections?.map(col => ({ id: col.id })),
      tags: prismaGroup.tags?.map(tag => ({ id: tag.id })),
      characters: prismaGroup.characters?.map(char => ({ id: char.id })),
      places: prismaGroup.places?.map(place => ({ id: place.id })),
      worldItems: prismaGroup.worldItems?.map(item => ({ id: item.id })),
      concepts: prismaGroup.concepts?.map(con => ({ id: con.id })),
      prompts: prismaGroup.prompts?.map(prompt => ({ id: prompt.id })),
      notes: prismaGroup.notes?.map(note => ({ id: note.id })),
      wildcards: prismaGroup.wildcards?.map(wild => ({ id: wild.id })),
      properties: prismaGroup.properties?.map(prop => ({ id: prop.id })),
      _count: counts,
    };
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Valida un Group
 */
export function validateGroup(data: unknown): GroupComplete {
  try {
    const validated = GroupSchema.parse(data);
    validateEntityRelations('Group', validated);
    return validated as GroupComplete;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔄 Extiende un Group con datos adicionales
 */
export function extendGroup(
  group: GroupBase,
  options: GroupTransformerOptions = {}
): GroupComplete {
  try {
    const extended = { ...group } as GroupComplete;

    // Deserializar campos JSON si son strings
    if (typeof extended.filters === 'string') {
      extended.filters = deserializeJsonField(extended.filters, '{}');
    }

    // Asegurar que las propiedades de UI tengan valores por defecto
    if (!extended.emoji) extended.emoji = DEFAULT_GROUP_EMOJI;
    if (!extended.color) extended.color = DEFAULT_GROUP_COLOR;

    // Inicializar relaciones vacías si se incluyen relaciones
    if (options.includeRelations) {
      extended.images = [];
      extended.videos = [];
      extended.albums = [];
      extended.collections = [];
      extended.tags = [];
      extended.characters = [];
      extended.places = [];
      extended.worldItems = [];
      extended.concepts = [];
      extended.prompts = [];
      extended.notes = [];
      extended.wildcards = [];
      extended.properties = [];
    }

    // Inicializar contadores si se incluyen conteos
    if (options.includeCount) {
      extended._count = {
        images: 0,
        videos: 0,
        albums: 0,
        collections: 0,
        tags: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0
      };
    }

    return extended;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * 🔍 Parsea filtros de Group
 */
export function parseGroupFilters(filters: unknown): Record<string, unknown> {
  try {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const parsed: Record<string, unknown> = {};
    const typedFilters = filters as Record<string, unknown>;

    // Procesar filtros específicos de Group
    if (typedFilters.search) {
      parsed.OR = [
        { name: { contains: typedFilters.search as string, mode: 'insensitive' } },
        { description: { contains: typedFilters.search as string, mode: 'insensitive' } },
      ];
    }

    if (typedFilters.categories?.length) {
      parsed.category = { in: typedFilters.categories };
    }

    if (typedFilters.isFavorite !== undefined) {
      parsed.favorite = typedFilters.isFavorite;
    }

    if (typedFilters.hasImages) {
      parsed.images = { some: {} };
    }

    if (typedFilters.hasVideos) {
      parsed.videos = { some: {} };
    }

    return parsed;
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Genera un emoji para el grupo basado en su nombre y categoría
 * @param name Nombre del grupo
 * @param category Categoría del grupo
 * @returns Emoji adecuado para el grupo
 */
export function generateGroupEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedCategory === 'favorites' || normalizedName.includes('favorit')) {
    return '⭐';
  }

  if (normalizedCategory === 'archive' || normalizedName.includes('archiv')) {
    return '🗄️';
  }

  if (normalizedCategory === 'projects' || normalizedName.includes('project')) {
    return '📊';
  }

  if (normalizedCategory === 'collections' || normalizedName.includes('collect')) {
    return '🌟';
  }

  if (normalizedCategory === 'smart' || normalizedName.includes('smart')) {
    return '🧠';
  }

  if (normalizedName.includes('recent')) {
    return '🕒';
  }

  // Valor predeterminado
  return DEFAULT_GROUP_EMOJI;
}

/**
 * Genera un color para el grupo basado en su nombre
 * @param name Nombre del grupo
 * @returns Color en formato hexadecimal
 */
export function generateGroupColor(name: string): string {
  // Lista de colores predefinidos
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316', // orange
    '#d946ef', // fuchsia
  ];

  // Calcular un valor hash simple basado en el nombre
  const hashValue = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Seleccionar un color basado en el hash
  return colors[hashValue % colors.length];
}

/**
 * Serializa los filtros de un grupo a formato JSON
 * @param filters Filtros a serializar
 * @returns String JSON con los filtros
 */
export function serializeGroupFilters(filters: any[]): string {
  if (!filters || filters.length === 0) {
    return 'empty_array';
  }

  try {
    return JSON.stringify(filters);
  } catch (error) {
    logger.error('Error al serializar filtros de grupo:', error);
    return 'empty_array';
  }
}

/**
 * Convierte un GroupBase con campos en formato de base de datos a un GroupComplete con todos los campos deserializados
 * @param group Objeto básico de grupo desde la base de datos
 * @returns Objeto GroupComplete con campos JSON parseados
 */
export function toGroupComplete(group: GroupBase): GroupComplete {
  try {
    return {
      ...group,
      filters: parseGroupFilters(group.filters || 'empty_array')
    };
  } catch (error) {
    logger.error('Error al convertir GroupBase a GroupComplete:', error);
    return {
      ...group,
      filters: []
    } as GroupComplete;
  }
}

/**
 * Convierte un GroupComplete con campos deserializados a un GroupBase con formato para la base de datos
 * @param group Objeto GroupComplete con campos parseados
 * @returns GroupBase con campos serializados para BD
 */
export function fromGroupComplete(group: GroupComplete): GroupBase {
  try {
    const { filters, ...rest } = group;

    // Convertir isFavorite a favorite si existe en el grupo
    const result: Record<string, any> = { ...rest };
    if ('isFavorite' in group) {
      result.favorite = group.isFavorite;
      result.isFavorite = undefined;
    }

    return {
      ...result,
      filters: serializeGroupFilters(filters || [])
    } as GroupBase;
  } catch (error) {
    logger.error('Error al convertir GroupComplete a GroupBase:', error);
    return {
      ...group,
      filters: 'empty_array'
    } as GroupBase;
  }
}

/**
 * Extiende múltiples grupos con propiedades adicionales para UI
 * @param groups Lista de grupos básicos o completos
 * @returns Lista de grupos extendidos
 */
export function extendGroups(groups: GroupBase[]): GroupComplete[] {
  return groups.map(group => extendGroup(group));
}

/**
 * Serializa un objeto a formato JSON
 * @param obj Objeto o string JSON
 * @returns String JSON serializado
 */
export function serializeObject(obj: Record<string, any> | string | null | undefined): string {
  try {
    if (obj === null || obj === undefined) {
      return '{}';
    }

    if (typeof obj === 'string') {
      // Si ya es un string, verificar si es un objeto JSON válido
      try {
        const parsed = JSON.parse(obj);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return obj; // Ya es un string JSON válido
        }
        return '{}'; // No es un objeto
      } catch {
        return '{}'; // No se pudo parsear, no es un JSON válido
      }
    }

    // Serializar el objeto
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? JSON.stringify(obj) : '{}';
  } catch (error) {
    logger.error('Error serializando objeto:', error);
    return '{}';
  }
}

/**
 * Serializa un array a formato JSON
 * @param arr Array o string JSON
 * @returns String JSON serializado
 */
export function serializeArray(arr: any[] | string | null | undefined): string {
  try {
    if (arr === null || arr === undefined) {
      return 'empty_array';
    }

    if (typeof arr === 'string') {
      // Si ya es un string, verificar si es un array JSON válido
      try {
        const parsed = JSON.parse(arr);
        if (Array.isArray(parsed)) {
          return arr; // Ya es un string JSON válido
        }
        return 'empty_array'; // No es un array
      } catch {
        return 'empty_array'; // No se pudo parsear, no es un JSON válido
      }
    }

    // Serializar el array
    return arr && Array.isArray(arr) && arr.length > 0 ? JSON.stringify(arr) : 'empty_array';
  } catch (error) {
    logger.error('Error serializando array:', error);
    return 'empty_array';
  }
}