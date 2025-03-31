/**
 * @file Funciones para serializar y deserializar datos de tags (v2)
 * @module transformers/tag/v2/serializers
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { TagSchema } from '@/types/entities/tag/schema';
import type {
    TagBase,
    TagComplete,
    TagDeserialized
} from '@/types/entities/tag/types';

// Logger específico para este módulo
const logger = serverLogger.child({ module: 'TagTransformer:Serializers' });

// Constantes para valores por defecto
export const DEFAULT_TAG_EMOJI = '🏷️';
export const DEFAULT_TAG_COLOR = '#3b82f6';

/**
 * Opciones para transformación de tags
 */
export interface TagTransformOptions {
  validateFields?: boolean;
  deserializeFields?: boolean;
  includeRelations?: boolean;
  includeUI?: boolean;
  includeStats?: boolean;
}

/**
 * Valida un objeto Tag contra su esquema
 * @param tag - Objeto Tag a validar
 * @returns El objeto validado o lanza un error
 */
export function validateTag(tag: Partial<TagBase>): TagBase {
  try {
    const result = TagSchema.parse(tag);
    return tag as TagBase;
  } catch (error) {
    logger.error('Error validando Tag', { error });
    throw new TransformerError(
      'TagTransformer',
      'Datos de Tag inválidos',
      { cause: error }
    );
  }
}

/**
 * Serializa un tag para Prisma
 * @param tag Tag con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Tag con campos serializados para Prisma
 */
export function toPrismaTag(
  tag: Partial<TagComplete>,
  options: TagTransformOptions = {}
): any {
  try {
    const { validateFields = true } = options;

    // Validar datos si se solicita
    if (validateFields && Object.keys(tag).length > 1) {
      validateTag(tag as TagBase);
    }

    // Crear objeto con solo propiedades válidas para Prisma
    const result = {
      id: tag.id,
      name: tag.name,
      emoji: tag.emoji,
      color: tag.color,
      description: tag.description,
      shortcut: tag.shortcut,
      category: tag.category,
      featuredImage: tag.featuredImage,
    };

    // Manejar la conversión de isFavorite a favorite si está presente
    if ('isFavorite' in tag) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.favorite = tag.isFavorite;
    } else if ('favorite' in tag) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.favorite = tag.favorite;
    }

    return result;
  } catch (error) {
    logger.error('Error serializando tag', { error });
    throw new TransformerError(
      'TagTransformer',
      'Error serializando tag',
      { cause: error }
    );
  }
}

/**
 * Deserializa un tag desde Prisma
 * @param tag Tag con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Tag con campos deserializados
 */
export function fromPrismaTag<T extends TagBase>(
  tag: T,
  options: TagTransformOptions = {}
): T & TagDeserialized & Partial<Record<'_relations' | '_count' | '_ui', any>> {
  try {
    const {
      includeRelations = false,
      includeUI = false,
      includeStats = false
    } = options;

    // Crear resultado base
    const result = { ...tag } as T & TagDeserialized;

    // Convertir favorite a isFavorite para mantener compatibilidad
    if ('favorite' in tag) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.isFavorite = tag.favorite;
    }

    // Agregar relaciones si están presentes y se solicitan
    if (includeRelations && (tag as any)._relations) {
      result._relations = (tag as any)._relations;
    }

    // Agregar conteos si están presentes y se solicitan estadísticas
    if (includeStats && (tag as any)._count) {
      result._count = (tag as any)._count;
    }

    // Agregar propiedades de UI si se solicitan
    if (includeUI) {
      result._ui = {
        lastUpdated: (tag as any).updatedAt || new Date(),
        itemCount: calculateItemCount(tag as any)
      };
    }

    return result;
  } catch (error) {
    logger.error('Error deserializando tag', { error });
    throw new TransformerError(
      'TagTransformer',
      'Error deserializando tag',
      { cause: error }
    );
  }
}

/**
 * Calcula el número total de elementos vinculados a un tag
 * @param tag Tag con posibles conteos
 * @returns Número total de elementos
 */
function calculateItemCount(tag: TagBase & { _count?: any }): number {
  if (!tag._count) return 0;

  return Object.values(tag._count).reduce(
    (total: number, count: any) => total + (count as number),
    0
  );
}

/**
 * Extiende un tag con datos de interfaz de usuario
 * @param tag Tag base
 * @returns Tag extendido con datos UI
 */
export function extendTag<T extends TagBase>(tag: T): T & {
  _ui: {
    lastUpdated: Date;
    itemCount: number;
  }
} {
  return fromPrismaTag(tag, { includeUI: true }) as any;
}

/**
 * Extiende un array de tags con datos de interfaz de usuario
 * @param tags Array de tags
 * @returns Array de tags extendidos
 */
export function extendTags(tags: TagBase[]): Array<ReturnType<typeof extendTag>> {
  return tags.map(tag => extendTag(tag));
}

/**
 * Convierte un tag a formato simplificado para relaciones
 * @deprecated Use toRelatedTag from mappers.ts instead
 * @param tag Tag con posibles conteos
 * @returns Tag formateado para relaciones
 */
export function toRelatedTag(tag: TagBase & { _count?: any }): {
  id: string;
  name: string;
  emoji: string;
  color: string;
  itemCount: number;
} {
  const itemCount = tag._count
    ? Object.values(tag._count).reduce((acc: number, count: any) => acc + (count as number), 0)
    : 0;

  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    emoji: tag.emoji,
    itemCount,
  };
}