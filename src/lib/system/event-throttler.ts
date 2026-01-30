/**
 * @file Sistema de throttling para eventos de carpetas
 * @module lib/event-throttler
 * @description Optimiza los eventos evitando spam y mejorando el rendimiento ⚡
 */

import { serverLogger } from '@/lib/logger/server-logger';

// Logger específico para el throttler
const throttlerLogger = serverLogger.withContext('EventThrottler');

/**
 * Mapa para almacenar promesas pendientes de eventos throttled
 */
const pendingEvents = new Map<
	string,
	{
		promise: Promise<any>;
		resolve: (value: any) => void;
		reject: (error: any) => void;
		lastCall: number;
		args: any[];
	}
>();

/**
 * Interfaz para opciones de throttling
 */
export interface ThrottleOptions {
	/** Tiempo mínimo entre llamadas en ms (default: 1000ms) */
	delay?: number;
	/** Combinar múltiples llamadas en una sola (default: true) */
	merge?: boolean;
	/** Usar el último conjunto de argumentos en caso de merge (default: true) */
	useLatestArgs?: boolean;
}

/**
 * 🚀 OPTIMIZACIÓN: Throttle para funciones asíncronas con merge de eventos
 * @param fn Función a throttlear
 * @param key Clave única para identificar el throttle
 * @param options Opciones de throttling
 */
export function throttleEvent<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	key: string,
	options: ThrottleOptions = {}
): T {
	const { delay = 1000, merge = true, useLatestArgs = true } = options;

	return ((...args: Parameters<T>) => {
		const now = Date.now();
		const existing = pendingEvents.get(key);

		// Si hay un evento pendiente y merge está habilitado
		if (existing && merge) {
			const timeSinceLastCall = now - existing.lastCall;

			if (timeSinceLastCall < delay) {
				// Actualizar argumentos si se requiere usar los últimos
				if (useLatestArgs) {
					existing.args = args;
				}

				throttlerLogger.debug('🔄 Evento throttled (merge):', {
					key,
					timeSinceLastCall,
					delay,
				});

				return existing.promise;
			}
		}

		// Crear nueva promesa throttled
		let resolve = (_value: any): void => {};
		let reject = (_error: any): void => {};

		const promise = new Promise<ReturnType<T>>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		// Almacenar el evento pendiente
		pendingEvents.set(key, {
			promise,
			resolve,
			reject,
			lastCall: now,
			args,
		});

		// Ejecutar después del delay
		setTimeout(async () => {
			const eventData = pendingEvents.get(key);
			if (!eventData) {
				return;
			}

			try {
				throttlerLogger.info('🚀 Ejecutando evento throttled:', { key });
				const result = await fn(...eventData.args);
				eventData.resolve(result);
			} catch (error) {
				throttlerLogger.error('❌ Error en evento throttled:', { key, error });
				eventData.reject(error);
			} finally {
				pendingEvents.delete(key);
			}
		}, delay);

		throttlerLogger.debug('⏱️ Evento throttled programado:', {
			key,
			delay,
			argsCount: args.length,
		});

		return promise;
	}) as T;
}

/**
 * 🚀 OPTIMIZACIÓN: Batch throttler para múltiples operaciones
 */
export class BatchThrottler<T> {
	private batchQueue: T[] = [];
	private timeoutId: NodeJS.Timeout | null = null;
	private processing = false;

	constructor(
		private readonly processor: (items: T[]) => Promise<void>,
		private readonly delay = 1000,
		private readonly maxBatchSize = 50
	) {}

	/**
	 * Añade un item al batch queue
	 */
	add(item: T): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.batchQueue.push(item);

			// Procesar inmediatamente si alcanzamos el tamaño máximo
			if (this.batchQueue.length >= this.maxBatchSize) {
				this.processBatch().then(resolve).catch(reject);
				return;
			}

			// Programar procesamiento con delay
			if (!this.timeoutId) {
				this.timeoutId = setTimeout(() => {
					this.processBatch().then(resolve).catch(reject);
				}, this.delay);
			}
		});
	}

	/**
	 * Procesa el batch actual
	 */
	private async processBatch(): Promise<void> {
		if (this.processing || this.batchQueue.length === 0) {
			return;
		}

		this.processing = true;

		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}

		const itemsToProcess = [...this.batchQueue];
		this.batchQueue = [];

		try {
			throttlerLogger.info('🚀 Procesando batch:', {
				items: itemsToProcess.length,
			});

			await this.processor(itemsToProcess);

			throttlerLogger.info('✅ Batch procesado correctamente:', {
				items: itemsToProcess.length,
			});
		} catch (error) {
			throttlerLogger.error('❌ Error procesando batch:', {
				items: itemsToProcess.length,
				error,
			});
			throw error;
		} finally {
			this.processing = false;
		}
	}

	/**
	 * Fuerza el procesamiento inmediato del batch
	 */
	async flush(): Promise<void> {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
		return this.processBatch();
	}

	/**
	 * Obtiene el estado actual del batch
	 */
	getStatus() {
		return {
			queueSize: this.batchQueue.length,
			processing: this.processing,
			hasScheduled: this.timeoutId !== null,
		};
	}
}

/**
 * 🚀 OPTIMIZACIÓN: Debounce para eventos de alta frecuencia
 */
export function debounceEvent<T extends (...args: any[]) => any>(fn: T, delay = 300): T {
	let timeoutId: NodeJS.Timeout | null = null;

	return ((...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			fn(...args);
		}, delay);
	}) as T;
}

/**
 * Limpia todos los eventos pendientes
 */
export function clearAllPendingEvents(): void {
	throttlerLogger.info('🧹 Limpiando eventos pendientes:', {
		count: pendingEvents.size,
	});

	for (const [_key, event] of pendingEvents) {
		event.reject(new Error('Event cleared'));
	}

	pendingEvents.clear();
}

/**
 * Obtiene estadísticas de eventos pendientes
 */
export function getThrottleStats() {
	return {
		pendingEvents: pendingEvents.size,
		events: Array.from(pendingEvents.keys()),
	};
}
