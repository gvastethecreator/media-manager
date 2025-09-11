/**
 * @file Enums para la entidad QueueJob
 * @module types/entities/queue-job/enums
 */

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
	PAUSED = 'paused',
}
