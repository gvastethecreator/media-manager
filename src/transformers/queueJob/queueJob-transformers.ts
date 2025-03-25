import {
  type QueueJobData,
  type QueueJobExtended,
  QueueJobPriority,
  QueueJobStatus
} from "@/types/entities/queueJob/queueJob-types";
import type { QueueJob } from "@prisma/client";
import { differenceInSeconds, format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Convierte un string JSON a un objeto
 */
export function parseQueueJobData(data: string): QueueJobData {
  try {
    return JSON.parse(data) as QueueJobData;
  } catch (error) {
    console.error("Error parsing QueueJob data:", error);
    return { raw: data };
  }
}

/**
 * Convierte un objeto a string JSON
 */
export function stringifyQueueJobData(data: QueueJobData): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying QueueJob data:", error);
    return JSON.stringify({ error: "Error al procesar los datos" });
  }
}

/**
 * Obtiene texto descriptivo para un estado
 */
export function getQueueJobStatusText(status: string): string {
  switch (status) {
    case QueueJobStatus.PENDING:
      return "Pendiente";
    case QueueJobStatus.PROCESSING:
      return "Procesando";
    case QueueJobStatus.COMPLETED:
      return "Completado";
    case QueueJobStatus.FAILED:
      return "Fallido";
    case QueueJobStatus.RETRYING:
      return "Reintentando";
    case QueueJobStatus.CANCELLED:
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

/**
 * Obtiene texto descriptivo para una prioridad
 */
export function getQueueJobPriorityText(priority: number): string {
  if (priority >= QueueJobPriority.CRITICAL) return "Crítica";
  if (priority >= QueueJobPriority.HIGH) return "Alta";
  if (priority >= QueueJobPriority.NORMAL) return "Normal";
  return "Baja";
}

/**
 * Formatea una fecha para mostrar como tiempo relativo
 */
export function formatQueueJobDate(date: Date | null | undefined): string {
  if (!date) return "N/A";

  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Fecha inválida";
  }
}

/**
 * Calcula el tiempo transcurrido en segundos
 */
export function calculateElapsedTime(startDate: Date | null, endDate: Date | null = null): number {
  if (!startDate) return 0;

  const end = endDate || new Date();
  return differenceInSeconds(end, startDate);
}

/**
 * Estima el tiempo restante basado en el progreso actual
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
 * Transforma un QueueJob de Prisma a un objeto extendido para UI
 */
export function transformQueueJob(job: QueueJob): QueueJobExtended {
  const parsedData = job.data ? parseQueueJobData(job.data) : undefined;
  const startedAt = job.startedAt ? new Date(job.startedAt) : null;
  const createdAt = new Date(job.createdAt);
  const finishedAt = job.finishedAt ? new Date(job.finishedAt) : null;

  const elapsed = startedAt ? calculateElapsedTime(startedAt, finishedAt) : 0;
  const remaining = (startedAt && !finishedAt && job.progress > 0)
    ? estimateTimeRemaining(startedAt, job.progress)
    : undefined;

  return {
    ...job,
    parsedData,
    statusText: getQueueJobStatusText(job.status),
    priorityText: getQueueJobPriorityText(job.priority),
    elapsedTime: elapsed,
    timeRemaining: remaining,
    formattedCreatedAt: format(createdAt, "dd/MM/yyyy HH:mm:ss"),
    formattedStartedAt: startedAt ? format(startedAt, "dd/MM/yyyy HH:mm:ss") : undefined,
    formattedFinishedAt: finishedAt ? format(finishedAt, "dd/MM/yyyy HH:mm:ss") : undefined,
    progress: job.progress,
  };
}

/**
 * Transforma una lista de QueueJobs de Prisma a objetos extendidos
 */
export function transformQueueJobs(jobs: QueueJob[]): QueueJobExtended[] {
  return jobs.map(transformQueueJob);
}

/**
 * Parsea los metadatos de un QueueJob
 */
export function parseQueueJobMetadata(metadata: string | null): Record<string, unknown> | null {
  if (!metadata) return null;

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch (error) {
    console.error("Error parsing QueueJob metadata:", error);
    return null;
  }
}

/**
 * Serializa los metadatos para guardar en la base de datos
 */
export function stringifyQueueJobMetadata(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.error("Error stringifying QueueJob metadata:", error);
    return null;
  }
}