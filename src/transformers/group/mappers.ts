/**
 * @file Funciones de mapeo para la entidad Group
 * @module transformers/group/mappers
 */

import type { CreateGroupData, GroupFilters, UpdateGroupData } from '@/types/entities/group/types';
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
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.emoji !== undefined) updateData.emoji = data.emoji;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
  if (data.filters !== undefined) updateData.filters = data.filters;
  if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;

  return updateData;
}

/**
 * Mapea filtros de grupo a formato compatible con Prisma para consultas
 * @param filters Filtros de grupo
 * @returns Objeto de condiciones para Prisma
 */
export function mapGroupFiltersToPrisma(filters: GroupFilters) {
  const where: Record<string, unknown> = {};

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  if (filters.categories?.length) {
    where.category = { in: filters.categories };
  }

  if (filters.isFavorite !== undefined) {
    where.isFavorite = filters.isFavorite;
  }

  if (filters.withImages) {
    where.images = { some: {} };
  }

  if (filters.withVideos) {
    where.videos = { some: {} };
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