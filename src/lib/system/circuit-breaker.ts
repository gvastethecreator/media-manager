/**
 * @file Circuit Breaker para prevenir loops infinitos y sobrecargas
 * @module lib/system/circuit-breaker
 * @description Implementa patrón circuit breaker para operaciones que pueden fallar
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { circuitBreakerLogger } from '@/lib/logger/reindex-file-logger';

const logger = clientLogger.withContext('CircuitBreaker');

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
	/** Número máximo de fallos antes de abrir el circuito */
	failureThreshold: number;
	/** Tiempo en ms antes de intentar cerrar el circuito */
	recoveryTimeout: number;
	/** Tiempo máximo en ms para una operación individual */
	operationTimeout: number;
	/** Multiplicador para backoff exponencial */
	backoffMultiplier: number;
	/** Tiempo máximo de backoff en ms */
	maxBackoffTime: number;
}

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
	failureThreshold: 3,
	recoveryTimeout: 60_000, // 1 minuto
	operationTimeout: 300_000, // 5 minutos
	backoffMultiplier: 2,
	maxBackoffTime: 300_000, // 5 minutos
};

export interface CircuitBreakerState {
	state: CircuitState;
	failureCount: number;
	lastFailureTime: number;
	nextAttemptTime: number;
	currentBackoffTime: number;
}

/**
 * Circuit Breaker que previene loops infinitos y operaciones repetitivas fallidas
 */
export class CircuitBreaker {
	private name: string;
	private config: CircuitBreakerConfig;
	private state: CircuitBreakerState;
	private activeOperations = new Set<string>();

	constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
		this.name = name;
		this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
		this.state = {
			state: 'CLOSED',
			failureCount: 0,
			lastFailureTime: 0,
			nextAttemptTime: 0,
			currentBackoffTime: 1000, // Comenzar con 1 segundo
		};

		logger.info(`📋 Circuit Breaker creado: ${name}`, { config: this.config });
	}

	/**
	 * Ejecuta una operación con protección de circuit breaker
	 */
	async execute<T>(operationId: string, operation: () => Promise<T>): Promise<T> {
		// Verificar si podemos ejecutar la operación
		this.checkState();

		// Verificar si la operación ya está en progreso
		if (this.activeOperations.has(operationId)) {
			throw new Error(`Operación ${operationId} ya está en progreso`);
		}

		// Marcar operación como activa
		this.activeOperations.add(operationId);
		logger.info(`🚀 Ejecutando operación ${operationId} (estado: ${this.state.state})`);

		try {
			// Ejecutar con timeout
			const result = await this.withTimeout(operation(), this.config.operationTimeout);

			// Éxito: resetear contador de fallos
			this.onSuccess();
			return result;
		} catch (error) {
			// Fallo: incrementar contador y abrir circuito si es necesario
			this.onFailure(error);
			throw error;
		} finally {
			// Limpiar operación activa
			this.activeOperations.delete(operationId);
		}
	}

	/**
	 * Verifica si podemos ejecutar operaciones
	 */
	private checkState(): void {
		const now = Date.now();

		switch (this.state.state) {
			case 'CLOSED':
				// Circuito cerrado, permitir operación
				break;

			case 'OPEN':
				// Verificar si es hora de intentar recuperación
				if (now >= this.state.nextAttemptTime) {
					logger.info(`🔄 Transicionando a HALF_OPEN: ${this.name}`);
					this.state.state = 'HALF_OPEN';
				} else {
					const waitTime = Math.ceil((this.state.nextAttemptTime - now) / 1000);
					throw new Error(`Circuit breaker abierto para ${this.name}. Reintente en ${waitTime}s`);
				}
				break;

			case 'HALF_OPEN':
				// Permitir una operación para probar recuperación
				break;

			default:
				// Estado desconocido, cerrar circuito por defecto
				this.state.state = 'CLOSED';
				break;
		}
	}

	/**
	 * Maneja operación exitosa
	 */
	private onSuccess(): void {
		logger.info(`✅ Operación exitosa en ${this.name}`);

		if (this.state.state === 'HALF_OPEN') {
			logger.info(`🔒 Cerrando circuit breaker: ${this.name}`);
		}

		this.state = {
			state: 'CLOSED',
			failureCount: 0,
			lastFailureTime: 0,
			nextAttemptTime: 0,
			currentBackoffTime: 1000,
		};
	}

	/**
	 * Maneja operación fallida
	 */
	private onFailure(error: any): void {
		const now = Date.now();
		this.state.failureCount++;
		this.state.lastFailureTime = now;

		logger.error(`❌ Fallo ${this.state.failureCount}/${this.config.failureThreshold} en ${this.name}:`, error);

		// Log to file for error tracking
		circuitBreakerLogger.logError(
			`Circuit breaker failure (${this.state.failureCount}/${this.config.failureThreshold}): ${this.name}`,
			{
				operationId: this.name,
				context: {
					failureCount: this.state.failureCount,
					failureThreshold: this.config.failureThreshold,
					currentBackoffTime: this.state.currentBackoffTime,
				},
				error: error instanceof Error ? error : new Error(String(error)),
			}
		);

		// Calcular nuevo backoff time
		this.state.currentBackoffTime = Math.min(
			this.state.currentBackoffTime * this.config.backoffMultiplier,
			this.config.maxBackoffTime
		);

		// Abrir circuito si se alcanzó el umbral
		if (this.state.failureCount >= this.config.failureThreshold) {
			this.state.state = 'OPEN';
			this.state.nextAttemptTime = now + this.state.currentBackoffTime;

			const waitTime = Math.ceil(this.state.currentBackoffTime / 1000);
			logger.warn(`🔓 Abriendo circuit breaker: ${this.name} (próximo intento en ${waitTime}s)`);

			// Log circuit breaker opening to file
			circuitBreakerLogger.logWarning(`Circuit breaker opened: ${this.name} (next attempt in ${waitTime}s)`, {
				operationId: this.name,
				context: {
					failureThreshold: this.config.failureThreshold,
					nextAttemptTime: this.state.nextAttemptTime,
					backoffTime: this.state.currentBackoffTime,
					waitTimeSeconds: waitTime,
				},
			});
		}
	}

	/**
	 * Implementa timeout para operaciones
	 */
	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
		let timeoutId: NodeJS.Timeout | undefined;

		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error(`Timeout de ${timeoutMs}ms alcanzado`));
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
	 * Obtiene el estado actual del circuit breaker
	 */
	getState(): CircuitBreakerState & { name: string; activeOperations: string[] } {
		return {
			name: this.name,
			...this.state,
			activeOperations: Array.from(this.activeOperations),
		};
	}

	/**
	 * Fuerza el reset del circuit breaker
	 */
	reset(): void {
		logger.info(`🔄 Reseteando circuit breaker: ${this.name}`);
		this.state = {
			state: 'CLOSED',
			failureCount: 0,
			lastFailureTime: 0,
			nextAttemptTime: 0,
			currentBackoffTime: 1000,
		};
		this.activeOperations.clear();
	}

	/**
	 * Verifica si el circuito está disponible
	 */
	isAvailable(): boolean {
		try {
			this.checkState();
			return true;
		} catch {
			return false;
		}
	}
}

/**
 * Registry global de circuit breakers
 */
class CircuitBreakerRegistry {
	private breakers = new Map<string, CircuitBreaker>();

	/**
	 * Obtiene o crea un circuit breaker
	 */
	getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
		if (!this.breakers.has(name)) {
			this.breakers.set(name, new CircuitBreaker(name, config));
		}
		const breaker = this.breakers.get(name);
		if (!breaker) {
			throw new Error(`Error interno: No se pudo crear circuit breaker ${name}`);
		}
		return breaker;
	}

	/**
	 * Obtiene todos los circuit breakers
	 */
	getAll(): Map<string, CircuitBreaker> {
		return new Map(this.breakers);
	}

	/**
	 * Resetea todos los circuit breakers
	 */
	resetAll(): void {
		logger.info('🔄 Reseteando todos los circuit breakers');
		for (const breaker of this.breakers.values()) {
			breaker.reset();
		}
	}

	/**
	 * Obtiene estadísticas de todos los circuit breakers
	 */
	getStats(): Record<string, any> {
		const stats: Record<string, any> = {};
		for (const [name, breaker] of this.breakers) {
			stats[name] = breaker.getState();
		}
		return stats;
	}
}

// Instancia singleton del registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Helper para obtener circuit breaker para reindexado de carpetas
 */
export function getFolderReindexCircuitBreaker(): CircuitBreaker {
	return circuitBreakerRegistry.getOrCreate('folder-reindex', {
		failureThreshold: 2, // Solo 2 fallos para carpetas
		recoveryTimeout: 120_000, // 2 minutos
		operationTimeout: 600_000, // 10 minutos para carpetas grandes
		backoffMultiplier: 2,
		maxBackoffTime: 600_000, // 10 minutos máximo
	});
}

/**
 * Helper para obtener circuit breaker para auto-indexing
 */
export function getAutoIndexCircuitBreaker(): CircuitBreaker {
	return circuitBreakerRegistry.getOrCreate('auto-index', {
		failureThreshold: 3,
		recoveryTimeout: 300_000, // 5 minutos
		operationTimeout: 180_000, // 3 minutos
		backoffMultiplier: 1.5,
		maxBackoffTime: 900_000, // 15 minutos máximo
	});
}
