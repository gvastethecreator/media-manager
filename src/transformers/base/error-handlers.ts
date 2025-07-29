/**
 * @file Utilitarios para el manejo de errores en transformadores
 * @module transformers/base/error-handlers
 * @description Define funciones helper para manejo consistente de errores
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
  MappingError,
  MetadataError,
  RelationError,
  SearchError,
  SerializationError,
  TransformerError,
  TransformerErrorContext,
  TypeMismatchError,
  UIError,
  ValidationError,
  handleTransformerError,
} from '@/lib/errors/transformer-error';

const logger = serverLogger.withContext('TransformerErrorHandlers');

/**
 * 🛡️ Decorador para manejar errores en transformadores
 * @param target Clase objetivo
 * @param propertyKey Nombre del método
 * @param descriptor Descriptor del método
 */
export function handleTransformerErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      return originalMethod.apply(this, args);
    } catch (error) {
      // Manejar el error y re-lanzar el tipo correcto
      throw handleTransformerError(error, {
        operation: propertyKey,
        entityType: (this as any)?.entityType || 'unknown',
        entityId: args[0]?.id,
      });
    }
  };

  return descriptor;
}

/**
 * 🔍 Validación básica de entidad con manejo de errores
 */
export function validateEntity<T extends { id: string }>(
  entity: T | null | undefined,
  context?: TransformerErrorContext
): void {
  if (!entity) {
    throw new ValidationError('Entidad nula o undefined', context);
  }

  if (!entity.id) {
    throw new ValidationError('ID de entidad requerido', context);
  }
}

/**
 * 🎯 Validación de tipo de entidad
 */
export function validateEntityType(
  actualType: string,
  expectedType: string,
  context?: TransformerErrorContext
): void {
  if (actualType !== expectedType) {
    throw new TypeMismatchError(
      `Tipo de entidad incorrecto: esperado ${expectedType}, recibido ${actualType}`,
      context
    );
  }
}

/**
 * 🔄 Manejo seguro de operación async con log
 */
export async function safeTransform<T, R>(
  operation: (data: T) => Promise<R>,
  data: T,
  context: TransformerErrorContext
): Promise<R> {
  try {
    return await operation(data);
  } catch (error) {
    logger.error('Error en transformación', { error, context });
    throw handleTransformerError(error, context);
  }
}

/**
 * 📦 Manejo seguro de serialización
 */
export function safeSerialize<T>(
  data: T,
  context?: TransformerErrorContext
): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    throw new SerializationError(
      'Error serializando datos',
      { ...context, data }
    );
  }
}

/**
 * 📥 Manejo seguro de deserialización
 */
export function safeDeserialize<T>(
  data: string,
  context?: TransformerErrorContext
): T {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    throw new SerializationError(
      'Error deserializando datos',
      { ...context, data }
    );
  }
}

/**
 * 🔗 Manejo seguro de relaciones
 */
export function validateRelation<T>(
  relation: T | null | undefined,
  entityType: string,
  relationName: string,
  context?: TransformerErrorContext
): void {
  if (!relation) {
    throw new RelationError(
      `Relación ${relationName} no encontrada para entidad ${entityType}`,
      context
    );
  }
}

export {
  MappingError,
  MetadataError,
  RelationError,
  SearchError,
  SerializationError,
  TransformerError,
  TypeMismatchError,
  UIError,
  ValidationError,
};
