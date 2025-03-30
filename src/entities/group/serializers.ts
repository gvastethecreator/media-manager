/**
 * @file Serializadores para la entidad Group
 * @module entities/group/serializers
 */

import { logger } from '@/lib/logger';
import { GroupSchema } from '@/types/entities/group/schema';
import type { GroupBase, GroupComplete, GroupWithStats } from '@/types/entities/group/types';

/**
 * Extiende un grupo con campos deserializados y relaciones
 */
export function extendGroup(group: GroupBase): GroupComplete {
  try {
    // Inicializar el objeto _count si no existe
    const extendedGroup: GroupComplete = {
      ...group,
      _count: {
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
      }
    };

    return extendedGroup;
  } catch (error) {
    logger.error('Error extendiendo el grupo:', error);
    // Devolver el grupo original si hay error
    return {
      ...group,
      _count: {}
    } as GroupComplete;
  }
}

/**
 * Extiende un grupo con estadísticas completas
 */
export function extendGroupWithStats(group: GroupComplete): GroupWithStats {
  try {
    const counts = group._count || {};

    // Calcular el total de entidades relacionadas
    const totalEntities =
      (counts.images || 0) +
      (counts.videos || 0) +
      (counts.albums || 0) +
      (counts.collections || 0) +
      (counts.tags || 0) +
      (counts.characters || 0) +
      (counts.places || 0) +
      (counts.worldItems || 0) +
      (counts.concepts || 0) +
      (counts.prompts || 0) +
      (counts.notes || 0) +
      (counts.wildcards || 0) +
      (counts.properties || 0);

    return {
      ...group,
      totalEntities,
      lastUpdated: group.updatedAt
    };
  } catch (error) {
    logger.error('Error calculando estadísticas del grupo:', error);
    return {
      ...group,
      totalEntities: 0,
      lastUpdated: group.updatedAt
    } as GroupWithStats;
  }
}

/**
 * Deserializa los filtros JSON de un grupo
 */
export function deserializeGroupFilters(filtersJson: string): Record<string, any> {
  try {
    if (!filtersJson) return {};
    return JSON.parse(filtersJson);
  } catch (error) {
    logger.error('Error deserializando filtros del grupo:', error);
    return {};
  }
}

/**
 * Serializa los filtros de un grupo a JSON
 */
export function serializeGroupFilters(filters: Record<string, any>): string {
  try {
    return JSON.stringify(filters || {});
  } catch (error) {
    logger.error('Error serializando filtros del grupo:', error);
    return '{}';
  }
}

/**
 * Valida un grupo usando el esquema definido
 */
export function validateGroup(group: GroupBase): boolean {
  try {
    GroupSchema.parse(group);
    return true;
  } catch (error) {
    logger.error('Error validando grupo:', error);
    return false;
  }
}

/**
 * Calcula estadísticas para un grupo
 */
export function calculateGroupStats(group: GroupComplete): {
  usageCount: number;
  relatedEntitiesCount: number;
} {
  try {
    const counts = group._count || {};

    // Sumar todas las entidades relacionadas
    const relatedEntitiesCount =
      (counts.images || 0) +
      (counts.videos || 0) +
      (counts.albums || 0) +
      (counts.collections || 0) +
      (counts.tags || 0) +
      (counts.characters || 0) +
      (counts.places || 0) +
      (counts.worldItems || 0) +
      (counts.concepts || 0) +
      (counts.prompts || 0) +
      (counts.notes || 0) +
      (counts.wildcards || 0) +
      (counts.properties || 0);

    // El conteo de uso es igual al número de relaciones
    const usageCount = relatedEntitiesCount;

    return {
      usageCount,
      relatedEntitiesCount
    };
  } catch (error) {
    logger.error('Error calculando estadísticas del grupo:', error);
    return {
      usageCount: 0,
      relatedEntitiesCount: 0
    };
  }
}