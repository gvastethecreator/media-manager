/**
 * @file Transformadores para la entidad Property
 * @module transformers/property/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { PropertySchema } from '@/types/entities/property/schema';
import type {
    PropertyBase,
    PropertyComplete,
    PropertyCounts,
    PropertyExtended,
    PropertyWithStats
} from '@/types/entities/property/types';
import { TransformerError } from '@/utils/transformers/errors';
import type { Property } from '@prisma/client';
import { fromPrismaProperty } from './serializers';

// Logger específico para este módulo
const logger = serverLogger.withContext('PropertyTransformer');

/**
 * Opciones para la transformación de propiedades
 */
export interface TransformPropertyOptions {
  /** Habilita la validación de campos */
  validateFields?: boolean;
  /** Deserializa campos JSON */
  deserializeFields?: boolean;
  /** Incluye relaciones */
  includeRelations?: boolean;
  /** Incluye propiedades UI */
  includeUI?: boolean;
  /** Incluye estadísticas calculadas */
  includeStats?: boolean;
}

/**
 * 🔍 Transforma una Property a su formato completo
 * @param property Property a transformar
 * @param options Opciones de transformación
 * @returns PropertyComplete con todos los campos
 * @throws TransformerError si hay errores en la transformación
 */
export function transformProperty<T extends Partial<PropertyBase> | Property | unknown>(
  property: T,
  options: TransformPropertyOptions = {}
): PropertyComplete {
  try {
    if (!property) {
      throw new Error('Property no proporcionada');
    }

    // Opciones por defecto
    const {
      validateFields = true,
      deserializeFields = true,
      includeRelations = true,
      includeUI = true,
      includeStats = true
    } = options;

    // Validar el objeto si se requiere
    if (validateFields && Object.keys(property as Record<string, any>).length > 1) {
      try {
        PropertySchema.parse(property);
      } catch (error) {
        throw new Error(`Validación de Property fallida: ${(error as Error).message}`);
      }
    }

    // Convertir a PropertyBase si es necesario
    let propertyBase: any;

    if ((property as any).id) {
      // Si ya tiene ID, asumimos que es una PropertyBase o compatible
      propertyBase = property;
    } else {
      throw new Error('Objeto Property inválido, no contiene ID');
    }

    // Deserializar de Prisma si es necesario
    return fromPrismaProperty(propertyBase, {
      deserializeFields,
      includeRelations,
      includeUI,
      includeStats
    });
  } catch (error) {
    logger.error('Error transformando property', { error });
    throw new TransformerError('Error al transformar Property', { cause: error });
  }
}

/**
 * 🔍 Transforma un array de Properties a su formato completo
 * @param properties Array de Properties a transformar
 * @param options Opciones de transformación
 * @returns Array de PropertyComplete con todos los campos
 * @throws TransformerError si hay errores en la transformación
 */
export function transformProperties<T extends Partial<PropertyBase> | Property | unknown>(
  properties: T[],
  options: TransformPropertyOptions = {}
): PropertyComplete[] {
  try {
    if (!Array.isArray(properties)) {
      throw new Error('Se esperaba un array de Properties');
    }

    return properties.map(property => transformProperty(property, options));
  } catch (error) {
    logger.error('Error transformando array de properties', { error });
    throw new TransformerError('Error al transformar array de Properties', { cause: error });
  }
}

/**
 * 🔍 Transforma una Property a su versión extendida
 * @param property Property a transformar
 * @returns PropertyExtended con campos adicionales
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPropertyToExtended<T extends Partial<PropertyComplete> | Property | unknown>(
  property: T
): PropertyExtended {
  try {
    // Primero transformamos a PropertyComplete
    const propertyComplete = transformProperty(property, {
      deserializeFields: true,
      includeRelations: true
    });

    // Añadimos campos extendidos
    return {
      ...propertyComplete,
      displayName: `${propertyComplete.emoji} ${propertyComplete.name}`,
      formattedDate: formatDate(propertyComplete.updatedAt),
      colorClass: generateColorClass(propertyComplete.color),
      categoryLabel: formatCategory(propertyComplete.category)
    };
  } catch (error) {
    logger.error('Error transformando property a versión extendida', { error });
    throw new TransformerError('Error al transformar Property a versión extendida', { cause: error });
  }
}

/**
 * 🔍 Transforma una Property a su versión con estadísticas
 * @param property Property a transformar
 * @returns PropertyWithStats con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPropertyToWithStats<T extends Partial<PropertyComplete> | Property | unknown>(
  property: T
): PropertyWithStats {
  try {
    // Primero transformamos a PropertyComplete
    const propertyComplete = transformProperty(property, {
      deserializeFields: true,
      includeRelations: true,
      includeUI: true,
      includeStats: true
    });

    // Calculamos estadísticas
    return {
      ...propertyComplete,
      stats: {
        imageCount: propertyComplete._count?.images || 0,
        videoCount: propertyComplete._count?.videos || 0,
        albumCount: propertyComplete._count?.albums || 0,
        collectionCount: propertyComplete._count?.collections || 0,
        tagCount: propertyComplete._count?.tags || 0,
        characterCount: propertyComplete._count?.characters || 0,
        placeCount: propertyComplete._count?.places || 0,
        worldItemCount: propertyComplete._count?.worldItems || 0,
        conceptCount: propertyComplete._count?.concepts || 0,
        promptCount: propertyComplete._count?.prompts || 0,
        noteCount: propertyComplete._count?.notes || 0,
        wildcardCount: propertyComplete._count?.wildcards || 0,
        groupCount: propertyComplete._count?.groups || 0,
        totalContentItems: calculateTotalContent(propertyComplete),
        usageCount: calculateUsageCount(propertyComplete),
        lastUpdated: propertyComplete.updatedAt
      }
    };
  } catch (error) {
    logger.error('Error transformando property con estadísticas', { error });
    throw new TransformerError('Error al transformar Property con estadísticas', { cause: error });
  }
}

/**
 * Calcula la cantidad total de elementos para una propiedad
 * @param property Propiedad a analizar
 * @returns Cantidad total de elementos
 */
function calculateTotalContent(property: PropertyComplete): number {
  // Si tiene conteos, los sumamos
  const counts = property._count as PropertyCounts;

  if (!counts) return 0;

  return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
}

/**
 * Calcula el conteo de uso de una propiedad
 * @param property Propiedad a analizar
 * @returns Conteo de uso
 */
function calculateUsageCount(property: PropertyComplete): number {
  // Por ahora, es el mismo que el total de contenido
  // En un futuro, podría incluir otros factores como frecuencia de uso
  return calculateTotalContent(property);
}

/**
 * Formatea la fecha para presentación
 * @param date Fecha a formatear
 * @returns Fecha formateada
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Genera una clase CSS basada en el color de la propiedad
 * @param color Color en formato hexadecimal
 * @returns Clase CSS
 */
function generateColorClass(color: string): string {
  // Convertir a valor numérico
  const colorValue = Number.parseInt(color.replace('#', ''), 16);

  // Determinar si es claro u oscuro
  const isDark = colorValue < 0x888888;

  return isDark ? 'text-white bg-opacity-90' : 'text-gray-900 bg-opacity-80';
}

/**
 * Formatea la categoría para presentación
 * @param category Categoría de la propiedad
 * @returns Etiqueta formateada
 */
function formatCategory(category: string | null): string {
  if (!category) return 'General';

  return category.charAt(0).toUpperCase() + category.slice(1);
}