/**
 * @file Funciones de mapeo para la entidad Property
 * @module transformers/property/mappers
 */

import type { Prisma } from '@prisma/client';
import {
  type CreatePropertyData,
  type PropertyBase,
  type PropertyComplete,
  type PropertyFilters,
  type PropertySearchOptions,
  type PropertySearchResult,
  PropertySortCriteria,
  type PropertyUpdateInput,
  PROPERTY_SORT_PROPERTY_MAP
} from '@/types/entities/property/types';
import { createLogger } from '@/lib/logger';
import { generatePropertyColor, generatePropertyEmoji, fromPrismaProperty } from './serializers';

// Logger específico para este módulo
const logger = createLogger('PropertyTransformer:Mappers');

/**
 * Mapea datos de creación de propiedad a formato compatible con Prisma
 * @param data Datos de creación de propiedad
 * @returns Objeto formateado para Prisma
 */
export function toCreatePropertyData(data: CreatePropertyData): Prisma.PropertyCreateInput {
  try {
    return {
      name: data.name,
      emoji: data.emoji || generatePropertyEmoji(data.name, data.category),
      color: data.color || generatePropertyColor(data.name),
      description: data.description || null,
      shortcut: data.shortcut || null,
      category: data.category || 'general',
      featuredImage: data.featuredImage || null,
      isFavorite: data.isFavorite || false,
    };
  } catch (error) {
    logger.error('Error mapeando datos de creación de Property', error);
    throw new Error(`Error mapeando datos de creación: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea datos de actualización de propiedad a formato compatible con Prisma
 * @param data Datos de actualización de propiedad
 * @returns Objeto formateado para Prisma
 */
export function toUpdatePropertyData(data: PropertyUpdateInput): Prisma.PropertyUpdateInput {
  try {
    // Crear objeto con solo las propiedades definidas
    const prismaData: Prisma.PropertyUpdateInput = {};

    if (data.name !== undefined) prismaData.name = data.name;
    if (data.emoji !== undefined) prismaData.emoji = data.emoji;
    if (data.color !== undefined) prismaData.color = data.color;
    if (data.description !== undefined) prismaData.description = data.description;
    if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
    if (data.category !== undefined) prismaData.category = data.category;
    if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
    if (data.isFavorite !== undefined) prismaData.isFavorite = data.isFavorite;

    return prismaData;
  } catch (error) {
    logger.error('Error mapeando datos de actualización de Property', error);
    throw new Error(`Error mapeando datos de actualización: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto de opciones para Prisma
 */
export function toSearchOptions(options: PropertySearchOptions = {}): {
  skip?: number;
  take?: number;
  orderBy?: any;
  where?: any;
  include?: any;
} {
  try {
    const {
      page = 1,
      pageSize = 20,
      sortBy = PropertySortCriteria.NAME_ASC,
      filters = {},
      include = {}
    } = options;

    // Calcular paginación
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Mapear filtros
    const where = toSearchFilters(filters);

    // Mapear ordenación
    const orderByProperty = PROPERTY_SORT_PROPERTY_MAP[sortBy];
    const orderByDirection = sortBy.endsWith(':desc') ? 'desc' : 'asc';
    const orderBy = { [orderByProperty]: orderByDirection };

    // Mapear inclusiones
    const includeOptions: any = {};

    if (include.images) includeOptions.images = true;
    if (include.videos) includeOptions.videos = true;
    if (include.albums) includeOptions.albums = true;
    if (include.collections) includeOptions.collections = true;
    if (include.tags) includeOptions.tags = true;
    if (include.characters) includeOptions.characters = true;
    if (include.places) includeOptions.places = true;
    if (include.worldItems) includeOptions.worldItems = true;
    if (include.concepts) includeOptions.concepts = true;
    if (include.prompts) includeOptions.prompts = true;
    if (include.notes) includeOptions.notes = true;
    if (include.wildcards) includeOptions.wildcards = true;
    if (include.groups) includeOptions.groups = true;

    // Incluir conteos si se solicita alguna relación
    if (Object.keys(includeOptions).length > 0) {
      includeOptions._count = {
        select: Object.keys(includeOptions).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      };
    }

    return { skip, take, orderBy, where, include: includeOptions };
  } catch (error) {
    logger.error('Error mapeando opciones de búsqueda de Property', error);
    return { skip: 0, take: 20 };
  }
}

/**
 * Mapea filtros de propiedad a formato compatible con Prisma para consultas
 * @param filters Filtros de propiedad
 * @returns Objeto de condiciones para Prisma
 */
export function toSearchFilters(filters: PropertyFilters): any {
  try {
    const where: Record<string, any> = {};

    // Filtrar por término de búsqueda
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    // Filtrar por categorías
    if (filters.categories && filters.categories.length > 0) {
      where.category = { in: filters.categories };
    }

    // Filtrar favoritos
    if (filters.onlyFavorites) {
      where.isFavorite = true;
    }

    return where;
  } catch (error) {
    logger.error('Error mapeando filtros de Property', error);
    return {};
  }
}

/**
 * Mapea un array de propiedades a un resultado de búsqueda con paginación
 * @param properties Propiedades a mapear
 * @param options Opciones de búsqueda
 * @param total Total de propiedades sin paginar
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(
  properties: PropertyBase[],
  options: PropertySearchOptions = {},
  total: number
): PropertySearchResult {
  try {
    const { page = 1, pageSize = 20 } = options;
    const totalPages = Math.ceil(total / pageSize);

    // Deserializar campos JSON
    const items = properties.map(property => fromPrismaProperty(property, {
      includeUI: true,
      includeStats: true,
      includeRelations: true
    }));

    return {
      items: items as PropertyComplete[],
      total,
      totalPages
    };
  } catch (error) {
    logger.error('Error en toSearchResult:', error);
    throw new Error(`Error al mapear resultado de búsqueda: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mapea una propiedad a su versión simplificada para relaciones
 * @param property Propiedad completa
 * @returns Propiedad simplificada
 */
export function toRelatedProperty(property: PropertyBase & { _count?: any }): {
  id: string;
  name: string;
  color: string;
  emoji: string;
  itemCount: number;
} {
  try {
    return {
      id: property.id,
      name: property.name,
      color: property.color,
      emoji: property.emoji,
      itemCount: property._count ? (
        (property._count.images || 0) +
        (property._count.videos || 0) +
        (property._count.albums || 0) +
        (property._count.collections || 0) +
        (property._count.tags || 0) +
        (property._count.characters || 0) +
        (property._count.places || 0) +
        (property._count.worldItems || 0) +
        (property._count.concepts || 0) +
        (property._count.prompts || 0) +
        (property._count.notes || 0) +
        (property._count.wildcards || 0) +
        (property._count.groups || 0)
      ) : 0
    };
  } catch (error) {
    logger.error('Error en toRelatedProperty:', error);
    return {
      id: property.id,
      name: property.name || 'Propiedad sin nombre',
      color: property.color || generatePropertyColor(property.name || 'default'),
      emoji: property.emoji || '🔍',
      itemCount: 0
    };
  }
}