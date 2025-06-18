/**
 * @file Tipos canónicos para la entidad QueueJob
 * @module types/entities/queue-job/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para QueueJob.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Enum para el estado del trabajo en cola
 */
export enum QueueJobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	RETRYING = 'retrying',
	CANCELLED = 'cancelled',
}

/**
 * Tipo base canónico para QueueJob
 */
export interface QueueJobBase {
	id: string;
	queue: string;
	data: string;
	status: QueueJobStatus;
	attempts: number;
	maxAttempts: number;
	error?: string | null;
	progress: number;
	startedAt?: Date | null;
	finishedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	priority: number;
	metadata?: string | null;
	retryAt?: Date | null;
}

/**
 * Input para creación
 */
export interface QueueJobCreateInput {
	queue: string;
	data: string;
	maxAttempts?: number;
	priority?: number;
	metadata?: string;
}

/**
 * Input para actualización
 */
export type QueueJobUpdateInput = Partial<Omit<QueueJobBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de QueueJob
 */
export const QueueJobSchema = z.object({
	id: z.string(),
	queue: z.string(),
	data: z.string(),
	status: z.nativeEnum(QueueJobStatus),
	attempts: z.number(),
	maxAttempts: z.number(),
	error: z.string().nullable().optional(),
	progress: z.number(),
	startedAt: z.date().nullable().optional(),
	finishedAt: z.date().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	priority: z.number(),
	metadata: z.string().nullable().optional(),
	retryAt: z.date().nullable().optional(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con QueueJobSchema antes de persistir.
