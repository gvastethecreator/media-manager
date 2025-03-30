/**
 * @file Funciones de serialización para la entidad QueueJob
 * @module transformers/queueJob/serializers
 */

import { createLogger } from '@/lib/logger';
import { QueueJobSchema } from '@/types/entities/queueJob/schema';
import {
    type QueueJobBase,
    type QueueJobData,
    type QueueJobDeserialized,
    QueueJobPriority,
    QueueJobStatus,
    type QueueJobUI
} from '@/types/entities/queueJob/types';
import { differenceInSeconds, format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Logger específico para este módulo
const logger = createLogger('QueueJobTransformer:Serializers');

/**
 * Opciones para transformación de QueueJob
 */
export interface QueueJobTransformOptions {
  validateFields?: boolean;
  deserializeFields?: boolean;
  includeUI?: boolean;
}

/**
 * Valida un objeto QueueJob contra su esquema
 * @param queueJob - Objeto QueueJob a validar
 * @returns El objeto validado o lanza un error
 */
export function validateQueueJob(queueJob: Partial<QueueJobBase>): QueueJobBase {
  try {
    const result = QueueJobSchema.parse(queueJob);
    return queueJob as QueueJobBase;
  } catch (error) {
    logger.error('Error validando QueueJob:', error);
    throw new Error(`Datos de QueueJob inválidos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convierte un string JSON a un objeto
 * @param data String JSON
 * @returns Objeto parseado
 */
export function parseQueueJobData(data: string | null): QueueJobData | undefined {
  if (!data) return undefined;

  try {
    return JSON.parse(data) as QueueJobData;
  } catch (error) {
    logger.error('Error parsing QueueJob data:', error);
    return { raw: data };
  }
}

/**
 * Convierte un objeto a string JSON
 * @param data Objeto a serializar
 * @returns String JSON
 */
export function stringifyQueueJobData(data: QueueJobData | Record<string, unknown> | string | null): string | null {
  if (data === null) return null;
  if (typeof data === 'string') return data;

  try {
    return JSON.stringify(data);
  } catch (error) {
    logger.error('Error stringifying QueueJob data:', error);
    return JSON.stringify({ error: 'Error al procesar los datos' });
  }
}

/**
 * Parsea los metadatos de un QueueJob
 * @param metadata String JSON de metadatos
 * @returns Objeto parseado
 */
export function parseQueueJobMetadata(metadata: string | null): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch (error) {
    logger.error('Error parsing QueueJob metadata:', error);
    return undefined;
  }
}

/**
 * Serializa los metadatos para guardar en la base de datos
 * @param metadata Objeto de metadatos
 * @returns String JSON
 */
export function stringifyQueueJobMetadata(metadata: Record<string, unknown> | string | null): string | null {
  if (metadata === null) return null;
  if (typeof metadata === 'string') return metadata;

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    logger.error('Error stringifying QueueJob metadata:', error);
    return null;
  }
}

/**
 * Obtiene texto descriptivo para un estado
 * @param status Estado del trabajo
 * @returns Texto descriptivo
 */
export function getQueueJobStatusText(status: string): string {
  switch (status) {
    case QueueJobStatus.PENDING:
      return 'Pendiente';
    case QueueJobStatus.PROCESSING:
      return 'Procesando';
    case QueueJobStatus.COMPLETED:
      return 'Completado';
    case QueueJobStatus.FAILED:
      return 'Fallido';
    case QueueJobStatus.RETRYING:
      return 'Reintentando';
    case QueueJobStatus.CANCELLED:
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
}

/**
 * Obtiene texto descriptivo para una prioridad
 * @param priority Prioridad numérica
 * @returns Texto descriptivo
 */
export function getQueueJobPriorityText(priority: number): string {
  if (priority >= QueueJobPriority.CRITICAL) return 'Crítica';
  if (priority >= QueueJobPriority.HIGH) return 'Alta';
  if (priority >= QueueJobPriority.NORMAL) return 'Normal';
  return 'Baja';
}

/**
 * Formatea una fecha para mostrar como tiempo relativo
 * @param date Fecha a formatear
 * @returns Texto relativo
 */
export function formatQueueJobDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';

  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch (error) {
    logger.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
}

/**
 * Calcula el tiempo transcurrido en segundos
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin opcional (usa fecha actual si no se proporciona)
 * @returns Segundos transcurridos
 */
export function calculateElapsedTime(startDate: Date | null, endDate: Date | null = null): number {
  if (!startDate) return 0;

  const end = endDate || new Date();
  return differenceInSeconds(end, startDate);
}

/**
 * Estima el tiempo restante basado en el progreso actual
 * @param startDate Fecha de inicio
 * @param progress Progreso actual (0-100)
 * @returns Tiempo restante estimado en segundos
 */
export function estimateTimeRemaining(startDate: Date | null, progress: number): number | undefined {
  if (!startDate || progress <= 0) return undefined;

  const elapsed = calculateElapsedTime(startDate);
  if (elapsed <= 0 || progress >= 100) return 0;

  // Estimación basada en regla de tres simple
  return Math.round((elapsed / progress) * (100 - progress));
}

/**
 * Formatea segundos como texto descriptivo (HH:MM:SS)
 * @param seconds Segundos a formatear
 * @returns Texto formateado
 */
export function formatSeconds(seconds: number): string {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Deserializa un QueueJob de Prisma a un objeto con campos deserializados
 * @param queueJob QueueJob de la base de datos
 * @param options Opciones de deserialización
 * @returns QueueJob con campos deserializados
 */
export function fromPrismaQueueJob<T extends QueueJobBase>(
  queueJob: T,
  options: QueueJobTransformOptions = {}
): T & QueueJobDeserialized {
  try {
    if (!queueJob) {
      throw new Error('QueueJob no proporcionado');
    }

    const {
      includeUI = false,
      deserializeFields = true
    } = options;

    // Resultado base
    const result = {
      ...queueJob
    } as T & QueueJobDeserialized;

    // Deserializar campos si se solicita
    if (deserializeFields) {
      result.parsedData = parseQueueJobData(queueJob.data);
      result.parsedMetadata = parseQueueJobMetadata(queueJob.metadata);
    }

    // Agregar campos UI si se solicitan
    if (includeUI) {
      const startedAt = queueJob.startedAt ? new Date(queueJob.startedAt) : null;
      const createdAt = new Date(queueJob.createdAt);
      const finishedAt = queueJob.finishedAt ? new Date(queueJob.finishedAt) : null;

      const elapsed = startedAt ? calculateElapsedTime(startedAt, finishedAt) : 0;
      const remaining = startedAt && !finishedAt && queueJob.progress > 0
        ? estimateTimeRemaining(startedAt, queueJob.progress)
        : undefined;

      result._ui = {
        statusText: getQueueJobStatusText(queueJob.status),
        priorityText: getQueueJobPriorityText(queueJob.priority),
        elapsedTime: elapsed,
        timeRemaining: remaining,
        formattedCreatedAt: format(createdAt, 'dd/MM/yyyy HH:mm:ss'),
        formattedStartedAt: startedAt ? format(startedAt, 'dd/MM/yyyy HH:mm:ss') : undefined,
        formattedFinishedAt: finishedAt ? format(finishedAt, 'dd/MM/yyyy HH:mm:ss') : undefined,
      };
    }

    return result;
  } catch (error) {
    logger.error('Error en fromPrismaQueueJob:', error);
    throw new Error(`Error deserializando QueueJob: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Serializa un QueueJob para guardar en Prisma
 * @param queueJob QueueJob con campos deserializados
 * @param options Opciones de serialización
 * @returns QueueJob serializado para Prisma
 */
export function toPrismaQueueJob(
  queueJob: Partial<QueueJobDeserialized>,
  options: QueueJobTransformOptions = {}
): Partial<QueueJobBase> {
  try {
    if (!queueJob) {
      throw new Error('QueueJob no proporcionado');
    }

    const { validateFields = true } = options;

    // Validar datos si se solicita
    if (validateFields && Object.keys(queueJob).length > 1) {
      validateQueueJob(queueJob as QueueJobBase);
    }

    // Extraer campos que necesitan ser serializados
    const { parsedData, parsedMetadata, _ui, ...rest } = queueJob;

    // Serializar campos según sea necesario
    const result: Partial<QueueJobBase> = {
      ...rest,
      data: parsedData ? stringifyQueueJobData(parsedData) : queueJob.data,
      metadata: parsedMetadata ? stringifyQueueJobMetadata(parsedMetadata) : queueJob.metadata,
    };

    return result;
  } catch (error) {
    logger.error('Error en toPrismaQueueJob:', error);
    throw new Error(`Error serializando QueueJob: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extiende un QueueJob con campos UI adicionales
 * @param queueJob QueueJob base
 * @returns QueueJob extendido con campos UI
 */
export function extendQueueJob<T extends QueueJobBase>(queueJob: T): T & {
  _ui: QueueJobUI;
  parsedData?: QueueJobData;
  parsedMetadata?: Record<string, unknown>;
} {
  if (!queueJob) return null as any;

  try {
    return fromPrismaQueueJob(queueJob, {
      includeUI: true,
      deserializeFields: true
    }) as T & {
      _ui: QueueJobUI;
      parsedData?: QueueJobData;
      parsedMetadata?: Record<string, unknown>;
    };
  } catch (error) {
    logger.error('Error extendiendo QueueJob:', error);
    return {
      ...queueJob,
      _ui: {
        statusText: getQueueJobStatusText(queueJob.status || 'pending'),
        priorityText: getQueueJobPriorityText(queueJob.priority || 0),
        elapsedTime: 0,
        formattedCreatedAt: format(queueJob.createdAt || new Date(), 'dd/MM/yyyy HH:mm:ss'),
      },
      parsedData: undefined,
      parsedMetadata: undefined
    };
  }
}

/**
 * Extiende múltiples QueueJobs con campos UI adicionales
 * @param queueJobs Array de QueueJobs
 * @returns Array de QueueJobs extendidos
 */
export function extendQueueJobs(queueJobs: QueueJobBase[]): Array<ReturnType<typeof extendQueueJob>> {
  if (!queueJobs || !Array.isArray(queueJobs)) return [];
  return queueJobs.map(queueJob => extendQueueJob(queueJob));
}