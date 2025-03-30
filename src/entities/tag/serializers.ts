/**
 * @file Serializadores para la entidad Tag
 * @module entities/tag/serializers
 */

import { logger } from '@/lib/logger';
import { TagSchema } from '@/types/entities/tag/schema';
import type { Tag, TagComplete } from '@/types/entities/tag/types';

/**
 * Extiende un tag con datos adicionales y relaciones
 */
export function extendTag(tag: Tag): TagComplete {
  try {
    return {
      ...tag,
      _count: tag._count || {
        images: 0,
        videos: 0,
        albums: 0,
        collections: 0,
        characters: 0,
        places: 0,
        worldItems: 0,
        concepts: 0,
        prompts: 0,
        notes: 0,
        wildcards: 0,
        properties: 0,
        groups: 0
      }
    };
  } catch (error) {
    logger.error('Error extendiendo tag:', error);
    throw error;
  }
}

/**
 * Valida un tag usando el esquema definido
 */
export function validateTag(tag: Tag): boolean {
  try {
    TagSchema.parse(tag);
    return true;
  } catch (error) {
    logger.error('Error validando tag:', error);
    return false;
  }
}