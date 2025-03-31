/**
 * @file Funciones para serializar y deserializar datos de propiedades (v2)
 * @module transformers/property/v2/serializers
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { PropertySchema } from '@/types/entities/property/schema';
import type {
    PropertyBase,
    PropertyComplete,
    PropertyDeserialized
} from '@/types/entities/property/types';

// Logger específico para este módulo
const logger = serverLogger.child({ module: 'PropertyTransformer:Serializers' });

// Constantes para valores por defecto
export const DEFAULT_PROPERTY_EMOJI = '🔍';
export const DEFAULT_PROPERTY_COLOR = '#3b82f6';

/**
 * Opciones para transformación de propiedades
 */
export interface PropertyTransformOptions {
  validateFields?: boolean;
  deserializeFields?: boolean;
  includeRelations?: boolean;
  includeUI?: boolean;
  includeStats?: boolean;
}

/**
 * Valida un objeto Property contra su esquema
 * @param property - Objeto Property a validar
 * @returns El objeto validado o lanza un error
 */
export function validateProperty(property: Partial<PropertyBase>): PropertyBase {
  try {
    const result = PropertySchema.parse(property);
    return property as PropertyBase;
  } catch (error) {
    logger.error('Error validando Property', { error });
    throw new TransformerError(
      'PropertyTransformer',
      'Datos de Property inválidos',
      { cause: error }
    );
  }
}

/**
 * Genera un emoji para la propiedad basado en su nombre y categoría
 * @param name Nombre de la propiedad
 * @param category Categoría de la propiedad
 * @returns Emoji adecuado para la propiedad
 */
export function generatePropertyEmoji(name: string, category?: string): string {
  // Normalizar nombre y categoría para búsqueda
  const normalizedName = name.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';

  // Mapeo de categorías comunes a emojis
  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return '🎨';
  }

  if (normalizedName.includes('size') || normalizedName.includes('dimension')) {
    return '📏';
  }

  if (normalizedName.includes('weight') || normalizedName.includes('mass')) {
    return '⚖️';
  }

  if (normalizedName.includes('time') || normalizedName.includes('date')) {
    return '⏱️';
  }

  if (normalizedName.includes('location') || normalizedName.includes('place')) {
    return '📍';
  }

  if (normalizedName.includes('material') || normalizedName.includes('substance')) {
    return '💎';
  }

  if (normalizedName.includes('quality') || normalizedName.includes('rating')) {
    return '⭐';
  }

  if (normalizedName.includes('price') || normalizedName.includes('cost')) {
    return '💰';
  }

  if (normalizedName.includes('author') || normalizedName.includes('creator')) {
    return '👤';
  }

  // Categorías específicas
  if (normalizedCategory === 'physical') {
    return '📦';
  }

  if (normalizedCategory === 'metadata') {
    return '📝';
  }

  if (normalizedCategory === 'technical') {
    return '⚙️';
  }

  // Valor predeterminado
  return DEFAULT_PROPERTY_EMOJI;
}

/**
 * Genera un color para la propiedad basado en su nombre
 * @param name Nombre de la propiedad
 * @returns Color en formato hexadecimal
 */
export function generatePropertyColor(name: string): string {
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
 * Serializa una propiedad para Prisma
 * @param property Propiedad con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Propiedad con campos serializados para Prisma
 */
export function toPrismaProperty(
  property: Partial<PropertyComplete>,
  options: PropertyTransformOptions = {}
): any {
  try {
    const { validateFields = true } = options;

    // Validar datos si se solicita
    if (validateFields && Object.keys(property).length > 1) {
      validateProperty(property as PropertyBase);
    }

    // Crear objeto con solo propiedades válidas para Prisma
    const result = {
      id: property.id,
      name: property.name,
      emoji: property.emoji,
      color: property.color,
      description: property.description,
      shortcut: property.shortcut,
      category: property.category,
      featuredImage: property.featuredImage,
    };

    // Manejar la conversión de isFavorite a favorite si está presente
    if ('isFavorite' in property) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.favorite = property.isFavorite;
    } else if ('favorite' in property) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.favorite = property.favorite;
    }

    return result;
  } catch (error) {
    logger.error('Error serializando property', { error });
    throw new TransformerError(
      'PropertyTransformer',
      'Error serializando property',
      { cause: error }
    );
  }
}

/**
 * Deserializa una propiedad desde Prisma
 * @param property Propiedad con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Propiedad con campos deserializados
 */
export function fromPrismaProperty<T extends PropertyBase>(
  property: T,
  options: PropertyTransformOptions = {}
): T & PropertyDeserialized & Partial<Record<'_relations' | '_count' | '_ui', any>> {
  try {
    const {
      includeRelations = false,
      includeUI = false,
      includeStats = false
    } = options;

    // Crear resultado base
    const result = { ...property } as T & PropertyDeserialized;

    // Convertir favorite a isFavorite para mantener compatibilidad
    if ('favorite' in property) {
      // @ts-ignore - Ignorar error de tipo ya que estamos adaptando el campo
      result.isFavorite = property.favorite;
    }

    // Agregar relaciones si están presentes y se solicitan
    if (includeRelations && (property as any)._relations) {
      result._relations = (property as any)._relations;
    }

    // Agregar conteos si están presentes y se solicitan estadísticas
    if (includeStats && (property as any)._count) {
      result._count = (property as any)._count;
    }

    // Agregar propiedades de UI si se solicitan
    if (includeUI) {
      result._ui = {
        lastUpdated: (property as any).updatedAt || new Date(),
        itemCount: calculateItemCount(property as any)
      };
    }

    return result;
  } catch (error) {
    logger.error('Error deserializando property', { error });
    throw new TransformerError(
      'PropertyTransformer',
      'Error deserializando property',
      { cause: error }
    );
  }
}

/**
 * Calcula el número total de elementos vinculados a una propiedad
 * @param property Propiedad con posibles conteos
 * @returns Número total de elementos
 */
function calculateItemCount(property: PropertyBase & { _count?: any }): number {
  if (!property._count) return 0;

  return Object.values(property._count).reduce(
    (total: number, count: any) => total + (count as number),
    0
  );
}

/**
 * Extiende una propiedad con datos de interfaz de usuario
 * @param property Propiedad base
 * @returns Propiedad extendida con datos UI
 */
export function extendProperty<T extends PropertyBase>(property: T): T & {
  _ui: {
    lastUpdated: Date;
    itemCount: number;
  }
} {
  return fromPrismaProperty(property, { includeUI: true }) as any;
}

/**
 * Extiende un array de propiedades con datos de interfaz de usuario
 * @param properties Array de propiedades
 * @returns Array de propiedades extendidas
 */
export function extendProperties(properties: PropertyBase[]): Array<ReturnType<typeof extendProperty>> {
  return properties.map(property => extendProperty(property));
}

/**
 * Convierte una propiedad a formato simplificado para relaciones
 * @deprecated Use toRelatedProperty from mappers.ts instead
 * @param property Propiedad con posibles conteos
 * @returns Propiedad formateada para relaciones
 */
export function toRelatedProperty(property: PropertyBase & { _count?: any }): {
  id: string;
  name: string;
  emoji: string;
  color: string;
  itemCount: number;
} {
  const itemCount = property._count
    ? Object.values(property._count).reduce((acc: number, count: any) => acc + (count as number), 0)
    : 0;

  return {
    id: property.id,
    name: property.name,
    color: property.color,
    emoji: property.emoji,
    itemCount,
  };
}