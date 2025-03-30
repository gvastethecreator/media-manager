/**
 * @file Funciones de serialización para la entidad Wildcard
 * @module transformers/wildcard/serializers
 */

import { createLogger } from '@/lib/logger';
import { WildcardSchema } from '@/types/entities/wildcard/schema';
import type {
    WildcardBase,
    WildcardDeserialized,
    WildcardUI
} from '@/types/entities/wildcard/types';

// Logger específico para este módulo
const logger = createLogger('WildcardTransformer:Serializers');

// Constantes para valores por defecto
export const DEFAULT_WILDCARD_EMOJI = '🎭';
export const DEFAULT_WILDCARD_COLOR = '#3b82f6';

/**
 * Opciones para transformación de wildcards
 */
export interface WildcardTransformOptions {
  validateFields?: boolean;
  deserializeFields?: boolean;
  includeRelations?: boolean;
  includeUI?: boolean;
  includeStats?: boolean;
}

/**
 * Valida un objeto Wildcard contra su esquema
 * @param wildcard - Objeto Wildcard a validar
 * @returns El objeto validado o lanza un error
 */
export function validateWildcard(wildcard: Partial<WildcardBase>): WildcardBase {
  try {
    const result = WildcardSchema.parse(wildcard);
    return wildcard as WildcardBase;
  } catch (error) {
    logger.error('Error validando Wildcard:', error);
    throw new Error(`Datos de Wildcard inválidos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Genera un emoji para el comodín basado en su nombre y categoría
 * @param name Nombre del comodín
 * @param category Categoría del comodín
 * @returns Emoji adecuado para el comodín
 */
export function generateWildcardEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedName.includes('character') || normalizedName.includes('person')) {
    return '👤';
  }

  if (normalizedName.includes('landscape') || normalizedName.includes('scenery')) {
    return '🏞️';
  }

  if (normalizedName.includes('animal') || normalizedName.includes('creature')) {
    return '🐾';
  }

  if (normalizedName.includes('weapon') || normalizedName.includes('sword')) {
    return '⚔️';
  }

  if (normalizedName.includes('style') || normalizedName.includes('aesthetic')) {
    return '🎨';
  }

  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return '🌈';
  }

  if (normalizedName.includes('random') || normalizedName.includes('surprise')) {
    return '🎲';
  }

  if (normalizedName.includes('template') || normalizedName.includes('preset')) {
    return '📋';
  }

  // Categorías específicas
  if (normalizedCategory === 'characters') {
    return '👥';
  }

  if (normalizedCategory === 'places') {
    return '🗺️';
  }

  if (normalizedCategory === 'objects') {
    return '🧩';
  }

  if (normalizedCategory === 'styles') {
    return '✨';
  }

  // Valor predeterminado
  return DEFAULT_WILDCARD_EMOJI;
}

/**
 * Genera un color para el comodín basado en su nombre
 * @param name Nombre del comodín
 * @returns Color en formato hexadecimal
 */
export function generateWildcardColor(name: string): string {
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
 * Parsea los hijos serializados de un comodín
 * @param childrenJson String JSON con los hijos
 * @returns Array de hijos parseado o array vacío
 */
export function parseWildcardChildren(childrenJson: string): any[] {
  if (!childrenJson || childrenJson === 'empty_array' || childrenJson === '[]') {
    return [];
  }

  try {
    return JSON.parse(childrenJson);
  } catch (error) {
    logger.error('Error parsing wildcard children:', error);
    return [];
  }
}

/**
 * Serializa los hijos de un comodín a formato JSON
 * @param children Array de hijos a serializar
 * @returns String JSON con los hijos
 */
export function serializeWildcardChildren(children: any[] | string): string {
  if (typeof children === 'string') return children;
  if (!children || children.length === 0) {
    return 'empty_array';
  }

  try {
    return JSON.stringify(children);
  } catch (error) {
    logger.error('Error serializing wildcard children:', error);
    return 'empty_array';
  }
}

/**
 * Deserializa un Wildcard de Prisma a un objeto con campos deserializados
 * @param wildcard Wildcard de la base de datos
 * @param options Opciones de deserialización
 * @returns Wildcard con campos deserializados
 */
export function fromPrismaWildcard<T extends WildcardBase>(
  wildcard: T,
  options: WildcardTransformOptions = {}
): T & WildcardDeserialized {
  try {
    if (!wildcard) {
      throw new Error('Wildcard no proporcionado');
    }

    const {
      includeRelations = false,
      includeUI = false,
      includeStats = false,
      deserializeFields = true
    } = options;

    // Resultado base
    const result = {
      ...wildcard
    } as T & WildcardDeserialized;

    // Deserializar campos si se solicita
    if (deserializeFields) {
      result.parsedChildren = parseWildcardChildren(wildcard.children);
    }

    // Agregar relaciones si están presentes y se solicitan
    if (includeRelations && (wildcard as any)._relations) {
      result._relations = (wildcard as any)._relations;
    }

    // Agregar conteos si están presentes y se solicitan
    if (includeStats && (wildcard as any)._count) {
      result._count = (wildcard as any)._count;
    }

    // Agregar campos UI si se solicitan
    if (includeUI) {
      result._ui = {
        hasParent: !!wildcard.parentId,
        hasChildren: ((wildcard as any)._count?.childWildcards || 0) > 0,
        itemCount: calculateItemCount(wildcard as any),
        parsedChildren: result.parsedChildren || [],
        lastUpdated: wildcard.updatedAt instanceof Date
          ? wildcard.updatedAt
          : new Date(wildcard.updatedAt)
      };
    }

    return result;
  } catch (error) {
    logger.error('Error en fromPrismaWildcard:', error);
    throw new Error(`Error deserializando Wildcard: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Serializa un Wildcard para guardar en Prisma
 * @param wildcard Wildcard con campos deserializados
 * @param options Opciones de serialización
 * @returns Wildcard serializado para Prisma
 */
export function toPrismaWildcard(
  wildcard: Partial<WildcardDeserialized>,
  options: WildcardTransformOptions = {}
): Partial<WildcardBase> {
  try {
    if (!wildcard) {
      throw new Error('Wildcard no proporcionado');
    }

    const { validateFields = true } = options;

    // Validar datos si se solicita
    if (validateFields && Object.keys(wildcard).length > 1) {
      validateWildcard(wildcard as WildcardBase);
    }

    // Extraer campos que necesitan ser serializados
    const { parsedChildren, _relations, _count, _ui, ...rest } = wildcard;

    // Serializar campos según sea necesario
    const result: Partial<WildcardBase> = {
      ...rest,
      children: parsedChildren ? serializeWildcardChildren(parsedChildren) : wildcard.children,
    };

    return result;
  } catch (error) {
    logger.error('Error en toPrismaWildcard:', error);
    throw new Error(`Error serializando Wildcard: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calcula el número total de elementos relacionados con un comodín
 * @param wildcard Comodín con conteos de relaciones
 * @returns Número total de elementos
 */
function calculateItemCount(wildcard: any): number {
  if (!wildcard || !wildcard._count) return 0;

  return (
    (wildcard._count.images || 0) +
    (wildcard._count.videos || 0) +
    (wildcard._count.albums || 0) +
    (wildcard._count.collections || 0) +
    (wildcard._count.tags || 0) +
    (wildcard._count.characters || 0) +
    (wildcard._count.places || 0) +
    (wildcard._count.worldItems || 0) +
    (wildcard._count.concepts || 0) +
    (wildcard._count.prompts || 0) +
    (wildcard._count.notes || 0) +
    (wildcard._count.properties || 0) +
    (wildcard._count.groups || 0)
  );
}

/**
 * Extiende un comodín con campos UI adicionales
 * @param wildcard Comodín base
 * @returns Comodín extendido con campos UI
 */
export function extendWildcard<T extends WildcardBase>(wildcard: T): T & {
  _ui: WildcardUI;
  parsedChildren: any[];
} {
  if (!wildcard) return null as any;

  try {
    const deserialized = fromPrismaWildcard(wildcard, {
      includeUI: true,
      deserializeFields: true
    });

    return {
      ...deserialized,
      _ui: deserialized._ui as WildcardUI,
      parsedChildren: deserialized.parsedChildren as any[]
    };
  } catch (error) {
    logger.error('Error extendiendo Wildcard:', error);
    return {
      ...wildcard,
      parsedChildren: parseWildcardChildren(wildcard.children),
      _ui: {
        hasParent: !!wildcard.parentId,
        hasChildren: false,
        itemCount: 0,
        parsedChildren: parseWildcardChildren(wildcard.children),
        lastUpdated: wildcard.updatedAt instanceof Date
          ? wildcard.updatedAt
          : new Date(wildcard.updatedAt)
      }
    };
  }
}

/**
 * Extiende múltiples comodines con campos UI adicionales
 * @param wildcards Array de comodines
 * @returns Array de comodines extendidos
 */
export function extendWildcards(wildcards: WildcardBase[]): Array<ReturnType<typeof extendWildcard>> {
  if (!wildcards || !Array.isArray(wildcards)) return [];
  return wildcards.map(wildcard => extendWildcard(wildcard));
}

/**
 * Convierte un comodín a formato simplificado para relaciones
 * @param wildcard Comodín completo
 * @returns Comodín simplificado para relaciones
 */
export function toRelatedWildcard(wildcard: WildcardBase & { _count?: any }): {
  id: string;
  name: string;
  emoji: string;
  color: string;
  parsedChildren: any[];
  hasParent: boolean;
  hasChildren: boolean;
  itemCount: number;
} {
  try {
    return {
      id: wildcard.id,
      name: wildcard.name,
      emoji: wildcard.emoji,
      color: wildcard.color,
      parsedChildren: parseWildcardChildren(wildcard.children),
      hasParent: !!wildcard.parentId,
      hasChildren: (wildcard._count?.childWildcards || 0) > 0,
      itemCount: calculateItemCount(wildcard)
    };
  } catch (error) {
    logger.error('Error en toRelatedWildcard:', error);
    return {
      id: wildcard.id,
      name: wildcard.name || 'Comodín sin nombre',
      emoji: wildcard.emoji || DEFAULT_WILDCARD_EMOJI,
      color: wildcard.color || DEFAULT_WILDCARD_COLOR,
      parsedChildren: [],
      hasParent: false,
      hasChildren: false,
      itemCount: 0
    };
  }
}