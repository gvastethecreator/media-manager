/**
 * @file Monitor de operaciones de reindexado
 * @module lib/system/reindex-monitor
 * @description Sistema de monitoreo para detectar y prevenir problemas en reindexado
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { circuitBreakerRegistry } from './circuit-breaker';

const logger = clientLogger.withContext('ReindexMonitor');

export interface OperationMetrics {
	duration?: number;
	endTime?: number;
	error?: string;
	metadata: {
		folderId?: string;
		folderPath?: string;
		fileCount?: number;
		type: 'single-folder' | 'auto-index' | 'global-reindex';
	};
	operationId: string;
	startTime: number;
	status: 'running' | 'completed' | 'failed' | 'timeout';
}

export interface SystemHealth {
	activeOperations: number;
	averageOperationTime: number;
	circuitBreakerStatus: Record<string, any>;
	errorRate: number;
	memoryPressure: 'low' | 'medium' | 'high';
}

/**
 * Monitor global para operaciones de reindexado
 */
class ReindexMonitor {
	private readonly operations = new Map<string, OperationMetrics>();
	private readonly maxOperationsHistory = 100;
	private healthCheckInterval?: NodeJS.Timeout;
	private isMonitoring = false;

	/**
	 * Inicia el monitoreo del sistema
	 */
	start(): void {
		if (this.isMonitoring) {
			return;
		}

		this.isMonitoring = true;
		logger.info('🔍 Iniciando monitor de reindexado');

		// Health check cada 30 segundos
		this.healthCheckInterval = setInterval(() => {
			this.performHealthCheck();
		}, 30_000);

		// Health check inicial
		setTimeout(() => this.performHealthCheck(), 5000);
	}

	/**
	 * Detiene el monitoreo del sistema
	 */
	stop(): void {
		if (!this.isMonitoring) {
			return;
		}

		this.isMonitoring = false;
		logger.info('🛑 Deteniendo monitor de reindexado');

		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = undefined;
		}
	}

	/**
	 * Registra el inicio de una operación
	 */
	startOperation(operationId: string, metadata: OperationMetrics['metadata']): void {
		const operation: OperationMetrics = {
			operationId,
			startTime: Date.now(),
			status: 'running',
			metadata,
		};

		this.operations.set(operationId, operation);
		logger.debug(`🚀 Operation iniciada: ${operationId}`, { metadata });

		// Limpiar historial si es necesario
		this.cleanupOldOperations();
	}

	/**
	 * Registra la finalización exitosa de una operación
	 */
	completeOperation(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			logger.warn(`⚠️ Operation no encontrada: ${operationId}`);
			return;
		}

		const endTime = Date.now();
		operation.endTime = endTime;
		operation.duration = endTime - operation.startTime;
		operation.status = 'completed';

		this.operations.set(operationId, operation);
		logger.debug(`✅ Operation completada: ${operationId} (${operation.duration}ms)`);
	}

	/**
	 * Registra el fallo de una operación
	 */
	failOperation(operationId: string, error: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			logger.warn(`⚠️ Operation no encontrada: ${operationId}`);
			return;
		}

		const endTime = Date.now();
		operation.endTime = endTime;
		operation.duration = endTime - operation.startTime;
		operation.status = 'failed';
		operation.error = error;

		this.operations.set(operationId, operation);
		logger.debug(`❌ Operation fallida: ${operationId} (${operation.duration}ms) - ${error}`);
	}

	/**
	 * Realiza verificación de salud del sistema
	 */
	private performHealthCheck(): void {
		const health = this.getSystemHealth();

		logger.debug('📊 Health Check:', health);

		// Alertas automáticas
		if (health.activeOperations > 5) {
			logger.warn(`🚨 Muchas operaciones activas: ${health.activeOperations}`);
		}

		if (health.errorRate > 0.3) {
			logger.warn(`🚨 Alto ratio de errores: ${(health.errorRate * 100).toFixed(1)}%`);
		}

		if (health.averageOperationTime > 300_000) {
			// 5 minutos
			logger.warn(`🚨 Operaciones muy lentas: ${(health.averageOperationTime / 1000).toFixed(1)}s promedio`);
		}

		// Detectar operaciones colgadas
		this.detectStuckOperations();
	}

	/**
	 * Detecta operaciones que pueden estar colgadas
	 */
	private detectStuckOperations(): void {
		const now = Date.now();
		const stuckThreshold = 10 * 60 * 1000; // 10 minutos

		for (const [operationId, operation] of this.operations) {
			if (operation.status === 'running') {
				const runningTime = now - operation.startTime;

				if (runningTime > stuckThreshold) {
					logger.error(`🔒 Operation posiblemente colgada: ${operationId} (${Math.round(runningTime / 1000)}s)`);

					// Marcar como timeout
					operation.status = 'timeout';
					operation.endTime = now;
					operation.duration = runningTime;
					operation.error = 'Operation appears to be stuck';

					this.operations.set(operationId, operation);
				}
			}
		}
	}

	/**
	 * Obtiene las métricas de salud del sistema
	 */
	getSystemHealth(): SystemHealth {
		const now = Date.now();
		const activeOperations = Array.from(this.operations.values()).filter((op) => op.status === 'running');

		const completedOperations = Array.from(this.operations.values()).filter(
			(op) => op.status === 'completed' && op.duration
		);

		const failedOperations = Array.from(this.operations.values()).filter(
			(op) => op.status === 'failed' || op.status === 'timeout'
		);

		const totalFinished = completedOperations.length + failedOperations.length;

		const averageOperationTime =
			completedOperations.length > 0
				? completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOperations.length
				: 0;

		const errorRate = totalFinished > 0 ? failedOperations.length / totalFinished : 0;

		// Estimación simple de presión de memoria basada en operaciones activas
		let memoryPressure: 'low' | 'medium' | 'high' = 'low';
		if (activeOperations.length > 3) {
			memoryPressure = 'medium';
		}
		if (activeOperations.length > 8) {
			memoryPressure = 'high';
		}

		return {
			activeOperations: activeOperations.length,
			averageOperationTime,
			errorRate,
			memoryPressure,
			circuitBreakerStatus: circuitBreakerRegistry.getStats(),
		};
	}

	/**
	 * Obtiene métricas detalladas de operaciones
	 */
	getOperationsMetrics(): {
		total: number;
		running: number;
		completed: number;
		failed: number;
		timeout: number;
		recentOperations: OperationMetrics[];
	} {
		const operations = Array.from(this.operations.values());

		// Últimas 20 operaciones
		const recentOperations = operations.sort((a, b) => b.startTime - a.startTime).slice(0, 20);

		return {
			total: operations.length,
			running: operations.filter((op) => op.status === 'running').length,
			completed: operations.filter((op) => op.status === 'completed').length,
			failed: operations.filter((op) => op.status === 'failed').length,
			timeout: operations.filter((op) => op.status === 'timeout').length,
			recentOperations,
		};
	}

	/**
	 * Limpia operaciones antiguas para evitar memory leaks
	 */
	private cleanupOldOperations(): void {
		if (this.operations.size <= this.maxOperationsHistory) {
			return;
		}

		const operations = Array.from(this.operations.entries()).sort(([, a], [, b]) => b.startTime - a.startTime);

		// Mantener solo las más recientes
		const toKeep = operations.slice(0, this.maxOperationsHistory);

		this.operations.clear();
		for (const [id, operation] of toKeep) {
			this.operations.set(id, operation);
		}

		logger.debug(
			`🧹 Limpieza de operaciones: conservadas ${toKeep.length}, eliminadas ${operations.length - toKeep.length}`
		);
	}

	/**
	 * Fuerza la cancelación de todas las operaciones activas
	 */
	cancelAllActiveOperations(): void {
		const activeOps = Array.from(this.operations.values()).filter((op) => op.status === 'running');

		logger.warn(`🛑 Cancelando ${activeOps.length} operaciones activas`);

		for (const operation of activeOps) {
			this.failOperation(operation.operationId, 'Cancelled by monitor');
		}
	}

	/**
	 * Reset completo del monitor
	 */
	reset(): void {
		logger.info('🔄 Reseteando monitor de reindexado');
		this.operations.clear();
		circuitBreakerRegistry.resetAll();
	}
}

// Instancia singleton del monitor
export const reindexMonitor = new ReindexMonitor();

/**
 * Helper para crear un operationId único
 */
export function generateOperationId(type: string, identifier?: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substr(2, 6);
	return identifier ? `${type}-${identifier}-${timestamp}-${random}` : `${type}-${timestamp}-${random}`;
}

/**
 * Helper para wrappear operaciones con monitoreo automático
 */
export async function withOperationMonitoring<T>(
	operationId: string,
	metadata: OperationMetrics['metadata'],
	operation: () => Promise<T>
): Promise<T> {
	reindexMonitor.startOperation(operationId, metadata);

	try {
		const result = await operation();
		reindexMonitor.completeOperation(operationId);
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		reindexMonitor.failOperation(operationId, errorMessage);
		throw error;
	}
}
