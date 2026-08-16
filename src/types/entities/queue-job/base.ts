/**
 * 🚀 QUEUE-JOB BASE TYPES
 *
 * Tipos base para queue-jobs usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

import { QueueJobStatus } from './enums';

/**
 * 🗿 Modelo base de QueueJob, derivado del schema de Drizzle.
 */
export interface QueueJobBase {
	attempts: number;
	completedAt: Date | null;
	createdAt: Date;
	data: string;
	delay: number;
	error: string | null;
	failedAt: Date | null;
	id: string;
	maxAttempts: number;
	priority: number;
	queue: string;
	result: string | null;
	startedAt: Date | null;
	status: QueueJobStatus;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un QueueJob.
 */
export interface QueueJobStatistics extends EntityStats {
	averageRetryDelay: number; // Promedio de delay entre reintentos
	executionTime: number; // Tiempo de ejecución en ms (completedAt - startedAt)
	isStuck: boolean; // Si el job parece estar atascado
	performanceGrade: 'A' | 'B' | 'C' | 'D'; // Grade de rendimiento
	successRate: number; // Porcentaje de éxito basado en intentos
	waitTime: number; // Tiempo de espera en ms (startedAt - createdAt)
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
	data: string;
	delay?: number;
	maxAttempts?: number;
	priority?: number;
	queue: string;
}

/**
 * 📝 Datos para actualizar un QueueJob
 */
export interface QueueJobUpdateInput {
	attempts?: number;
	completedAt?: Date | null;
	error?: string | null;
	failedAt?: Date | null;
	result?: string | null;
	startedAt?: Date | null;
	status?: QueueJobStatus;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar QueueJobWithStats
 */
export type QueueJobComplete = QueueJobWithStats;
