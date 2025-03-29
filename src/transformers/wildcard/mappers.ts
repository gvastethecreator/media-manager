/**
 * @file Funciones de mapeo para la entidad Wildcard
 * @module transformers/wildcard/mappers
 */

import type { CreateWildcardData, UpdateWildcardData, WildcardFilters } from '../../types/entities/wildcard';
import { DEFAULT_WILDCARD_COLOR, DEFAULT_WILDCARD_EMOJI, parseWildcardChildren } from './serializers';

/**
 * Mapea datos de creación de comodín a formato compatible con Prisma
 * @param data Datos de creación de comodín
 * @returns Objeto formateado para Prisma
 */
export function mapCreateWildcardDataToPrisma(data: CreateWildcardData) {
  return {
    name: data.name,
    emoji: data.emoji || DEFAULT_WILDCARD_EMOJI,
    color: data.color || DEFAULT_WILDCARD_COLOR,
    description: data.description || null,
    shortcut: data.shortcut || null,
    category: data.category || 'general',
    children: data.children || 'empty_array',
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
    parentId: data.parentId || null,
  };
}

/**
 * Mapea datos de actualización de comodín a formato compatible con Prisma
 * @param data Datos de actualización de comodín
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateWildcardDataToPrisma(data: UpdateWildcardData) {
  // Crear objeto con solo las propiedades definidas
  const prismaData: Record<string, any> = {};

  if (data.name !== undefined) prismaData.name = data.name;
  if (data.emoji !== undefined) prismaData.emoji = data.emoji;
  if (data.color !== undefined) prismaData.color = data.color;
  if (data.description !== undefined) prismaData.description = data.description;
  if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
  if (data.category !== undefined) prismaData.category = data.category;
  if (data.children !== undefined) prismaData.children = data.children;
  if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
  if (data.isFavorite !== undefined) prismaData.isFavorite = data.isFavorite;
  if (data.parentId !== undefined) prismaData.parentId = data.parentId;

  return prismaData;
}

/**
 * Mapea filtros de comodín a formato compatible con Prisma para consultas
 * @param filters Filtros de comodín
 * @returns Objeto de condiciones para Prisma
 */
export function mapWildcardFiltersToPrisma(filters: WildcardFilters) {
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

  // Filtrar por padre (raíz o con padre específico)
  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId;
  }

  // Filtrar por si tiene hijos
  if (filters.hasChildren !== undefined) {
    // Esto requiere una lógica de post-procesamiento en el resultado de la consulta
    // ya que no podemos filtrar directamente por _count en Prisma
  }

  return { where };
}

/**
 * Mapea un comodín a su versión simplificada para relaciones
 * @param wildcard Comodín completo
 * @returns Comodín simplificado
 */
export function mapWildcardToRelatedWildcard(wildcard: any) {
  return {
    id: wildcard.id,
    name: wildcard.name,
    color: wildcard.color,
    emoji: wildcard.emoji,
    children: parseWildcardChildren(wildcard.children),
    hasParent: !!wildcard.parentId,
    hasChildren: (wildcard._count?.childWildcards || 0) > 0,
    itemCount: (
      (wildcard._count?.images || 0) +
      (wildcard._count?.videos || 0) +
      (wildcard._count?.albums || 0) +
      (wildcard._count?.collections || 0) +
      (wildcard._count?.tags || 0) +
      (wildcard._count?.characters || 0) +
      (wildcard._count?.places || 0) +
      (wildcard._count?.worldItems || 0) +
      (wildcard._count?.concepts || 0) +
      (wildcard._count?.prompts || 0) +
      (wildcard._count?.notes || 0) +
      (wildcard._count?.properties || 0) +
      (wildcard._count?.groups || 0)
    ),
  };
}