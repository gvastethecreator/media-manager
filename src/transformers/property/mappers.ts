/**
 * @file Funciones de mapeo para la entidad Property
 * @module transformers/property/mappers
 */

import type { CreatePropertyData, PropertyFilters, UpdatePropertyData } from '../../types/entities/property';
import { DEFAULT_PROPERTY_COLOR, DEFAULT_PROPERTY_EMOJI } from './serializers';

/**
 * Mapea datos de creación de propiedad a formato compatible con Prisma
 * @param data Datos de creación de propiedad
 * @returns Objeto formateado para Prisma
 */
export function mapCreatePropertyDataToPrisma(data: CreatePropertyData) {
  return {
    name: data.name,
    emoji: data.emoji || DEFAULT_PROPERTY_EMOJI,
    color: data.color || DEFAULT_PROPERTY_COLOR,
    description: data.description || null,
    shortcut: data.shortcut || null,
    category: data.category || 'general',
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
  };
}

/**
 * Mapea datos de actualización de propiedad a formato compatible con Prisma
 * @param data Datos de actualización de propiedad
 * @returns Objeto formateado para Prisma
 */
export function mapUpdatePropertyDataToPrisma(data: UpdatePropertyData) {
  // Crear objeto con solo las propiedades definidas
  const prismaData: Record<string, any> = {};

  if (data.name !== undefined) prismaData.name = data.name;
  if (data.emoji !== undefined) prismaData.emoji = data.emoji;
  if (data.color !== undefined) prismaData.color = data.color;
  if (data.description !== undefined) prismaData.description = data.description;
  if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
  if (data.category !== undefined) prismaData.category = data.category;
  if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
  if (data.isFavorite !== undefined) prismaData.isFavorite = data.isFavorite;

  return prismaData;
}

/**
 * Mapea filtros de propiedad a formato compatible con Prisma para consultas
 * @param filters Filtros de propiedad
 * @returns Objeto de condiciones para Prisma
 */
export function mapPropertyFiltersToPrisma(filters: PropertyFilters) {
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

  return { where };
}

/**
 * Mapea una propiedad a su versión simplificada para relaciones
 * @param property Propiedad completa
 * @returns Propiedad simplificada
 */
export function mapPropertyToRelatedProperty(property: any) {
  return {
    id: property.id,
    name: property.name,
    color: property.color,
    emoji: property.emoji,
    itemCount: (
      (property._count?.images || 0) +
      (property._count?.videos || 0) +
      (property._count?.albums || 0) +
      (property._count?.collections || 0) +
      (property._count?.tags || 0) +
      (property._count?.characters || 0) +
      (property._count?.places || 0) +
      (property._count?.worldItems || 0) +
      (property._count?.concepts || 0) +
      (property._count?.prompts || 0) +
      (property._count?.notes || 0) +
      (property._count?.wildcards || 0) +
      (property._count?.groups || 0)
    ),
  };
}