/**
 * @file Cola de operaciones para prevenir race conditions
 * @module store/unified-file-manager-queue
 */

import { clientLogger } from '@/lib/logger/client-logger';

const fileManagerLogger = clientLogger.withContext('UnifiedFileManager');
const MAX_OPERATION_QUEUE = 10; // 🔄 Límite de operaciones concurrentes

/**
 * OperationQueue: Gestiona una cola de operaciones asíncronas
 * para prevenir race conditions en el File Manager Store
 */
export class OperationQueue {
	private queue: Array<{
		operation: () => Promise<any>;
		timeout: number;
		startTime: number;
		id: string;
	}> = [];
	private isProcessing = false;
	private readonly maxSize = MAX_OPERATION_QUEUE;
	private currentOperation: { id: string; startTime: number } | null = null;

	/**
	 * Agrega una operación a la cola
	 * @param operation Función asíncrona a ejecutar
	 * @param timeout Tiempo máximo de ejecución (ms)
	 * @param id Identificador único de la operación
	 */
	async add<T>(
		operation: () => Promise<T>,
		timeout = 120_000, // 2 minutos por defecto
		id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	): Promise<T> {
		return new Promise((resolve, reject) => {
			if (this.queue.length >= this.maxSize) {
				fileManagerLogger.warn('🚨 Operation queue full, dropping oldest operation');
				this.queue.shift();
			}

			this.queue.push({
				operation: async () => {
					try {
						const result = await operation();
						resolve(result);
					} catch (error) {
						reject(error);
					}
				},
				timeout,
				startTime: 0, // Se asignará al procesar
				id,
			});

			this.processQueue();
		});
	}

	/**
	 * Procesa las operaciones en la cola secuencialmente
	 */
	private async processQueue() {
		if (this.isProcessing || this.queue.length === 0) {
			return;
		}

		this.isProcessing = true;

		while (this.queue.length > 0) {
			const operationWrapper = this.queue.shift();
			if (operationWrapper) {
				const { operation, timeout, id } = operationWrapper;
				operationWrapper.startTime = Date.now();
				this.currentOperation = { id, startTime: operationWrapper.startTime };

				try {
					// Ejecutar operación con timeout
					await this.withTimeout(operation(), timeout, id);
				} catch (error) {
					fileManagerLogger.error(`❌ Operation failed (${id}):`, error);
				} finally {
					this.currentOperation = null;
				}
			}
		}

		this.isProcessing = false;
	}

	/**
	 * Implementa timeout para operaciones
	 */
	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationId: string): Promise<T> {
		let timeoutId: NodeJS.Timeout | undefined;

		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error(`Operation ${operationId} timeout after ${timeoutMs}ms`));
			}, timeoutMs);
		});

		try {
			return await Promise.race([promise, timeoutPromise]);
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	}

	/**
	 * Limpia la cola y reinicia el estado
	 */
	clear() {
		fileManagerLogger.warn('🧹 Clearing operation queue', {
			queueSize: this.queue.length,
			currentOperation: this.currentOperation?.id,
		});
		this.queue = [];
		this.isProcessing = false;
		this.currentOperation = null;
	}

	/**
	 * Tamaño actual de la cola
	 */
	get length() {
		return this.queue.length;
	}

	/**
	 * Indica si hay una operación en procesamiento
	 */
	get processing() {
		return this.isProcessing;
	}

	/**
	 * Obtiene estadísticas de la cola
	 */
	getStats() {
		const now = Date.now();
		return {
			queueSize: this.queue.length,
			isProcessing: this.isProcessing,
			currentOperation: this.currentOperation
				? {
						id: this.currentOperation.id,
						runningTime: now - this.currentOperation.startTime,
					}
				: null,
			maxSize: this.maxSize,
		};
	}

	/**
	 * Cancela la operación actual si excede un tiempo límite
	 */
	cancelIfStuck(maxRunningTime = 300_000) {
		// 5 minutos
		if (this.currentOperation) {
			const runningTime = Date.now() - this.currentOperation.startTime;
			if (runningTime > maxRunningTime) {
				fileManagerLogger.warn(`🛑 Cancelando operación colgada: ${this.currentOperation.id} (${runningTime}ms)`);
				this.clear();
			}
		}
	}
}
