/**
 * 🚀 QUEUE-JOB BASE TYPES
 *
 * Tipos base para queue-jobs usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * Estado del trabajo en cola
 */
export enum QueueJobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	RETRYING = 'retrying',
	CANCELLED = 'cancelled',
	PAUSED = 'paused',
}

/**
 * 🗿 Modelo base de QueueJob, derivado del schema de Drizzle.
 */
export interface QueueJobBase {
	id: string;
	queue: string;
	data: string;
	status: QueueJobStatus;
	attempts: number;
	maxAttempts: number;
	priority: number;
	delay: number;
	result: string | null;
	error: string | null;
	startedAt: Date | null;
	completedAt: Date | null;
	failedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un QueueJob.
 */
export interface QueueJobStatistics extends EntityStats {
	executionTime: number; // Tiempo de ejecución en ms (completedAt - startedAt)
	waitTime: number; // Tiempo de espera en ms (startedAt - createdAt)
	successRate: number; // Porcentaje de éxito basado en intentos
	averageRetryDelay: number; // Promedio de delay entre reintentos
	isStuck: boolean; // Si el job parece estar atascado
	performanceGrade: 'A' | 'B' | 'C' | 'D'; // Grade de rendimiento
}

/**
 * ✨ Modelo extendido de QueueJob con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface QueueJobWithStats extends QueueJobBase {
	stats: QueueJobStatistics;
}

/**
 * 📝 Datos para crear un QueueJob
 */
export interface QueueJobCreateInput {
	queue: string;
	data: string;
	priority?: number;
	delay?: number;
	maxAttempts?: number;
}

/**
 * 📝 Datos para actualizar un QueueJob
 */
export interface QueueJobUpdateInput {
	status?: QueueJobStatus;
	attempts?: number;
	result?: string | null;
	error?: string | null;
	startedAt?: Date | null;
	completedAt?: Date | null;
	failedAt?: Date | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar QueueJobWithStats
 */
export type QueueJobComplete = QueueJobWithStats;
