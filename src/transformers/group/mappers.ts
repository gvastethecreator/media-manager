/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import type { CreateGroupData, GroupFilters, UpdateGroupData } from '../../types/entities/group';
import { DEFAULT_GROUP_COLOR, DEFAULT_GROUP_EMOJI } from './serializers';

/**
 * Mapea datos de creación de grupo a formato compatible con Prisma
 * @param data Datos de creación de grupo
 * @returns Objeto formateado para Prisma
 */
export function mapCreateGroupDataToPrisma(data: CreateGroupData) {
  return {
    name: data.name,
    emoji: data.emoji || DEFAULT_GROUP_EMOJI,
    color: data.color || DEFAULT_GROUP_COLOR,
    description: data.description || null,
    shortcut: data.shortcut || null,
    category: data.category || 'general',
    sortBy: data.sortBy || 'name',
    filters: data.filters || 'empty_array',
    featuredImage: data.featuredImage || null,
    isFavorite: data.isFavorite || false,
  };
}

/**
 * Mapea datos de actualización de grupo a formato compatible con Prisma
 * @param data Datos de actualización de grupo
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateGroupDataToPrisma(data: UpdateGroupData) {
  // Crear objeto con solo las propiedades definidas
  const prismaData: Record<string, any> = {};

  if (data.name !== undefined) prismaData.name = data.name;
  if (data.emoji !== undefined) prismaData.emoji = data.emoji;
  if (data.color !== undefined) prismaData.color = data.color;
  if (data.description !== undefined) prismaData.description = data.description;
  if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
  if (data.category !== undefined) prismaData.category = data.category;
  if (data.sortBy !== undefined) prismaData.sortBy = data.sortBy;
  if (data.filters !== undefined) prismaData.filters = data.filters;
  if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
  if (data.isFavorite !== undefined) prismaData.isFavorite = data.isFavorite;

  return prismaData;
}

/**
 * Mapea filtros de grupo a formato compatible con Prisma para consultas
 * @param filters Filtros de grupo
 * @returns Objeto de condiciones para Prisma
 */
export function mapGroupFiltersToPrisma(filters: GroupFilters) {
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
 * Mapea un grupo a su versión simplificada para relaciones
 * @param group Grupo completo
 * @returns Grupo simplificado
 */
export function mapGroupToRelatedGroup(group: any) {
  return {
    id: group.id,
    name: group.name,
    color: group.color,
    emoji: group.emoji,
    itemCount: (
      (group._count?.images || 0) +
      (group._count?.videos || 0) +
      (group._count?.albums || 0) +
      (group._count?.collections || 0) +
      (group._count?.tags || 0) +
      (group._count?.characters || 0) +
      (group._count?.places || 0) +
      (group._count?.worldItems || 0) +
      (group._count?.concepts || 0) +
      (group._count?.prompts || 0) +
      (group._count?.notes || 0) +
      (group._count?.wildcards || 0) +
      (group._count?.properties || 0)
    ),
  };
}