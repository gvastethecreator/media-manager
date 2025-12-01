/**
 * @file Servicio para acceder a configuración de thumbnails
 * @module services/thumbnail-config
 * @description Proporciona acceso centralizado a la configuración de thumbnails desde procesadores
 */

import {
	type ThumbnailAdvancedConfig,
	type EntityThumbnailConfig,
	DEFAULT_THUMBNAIL_ADVANCED_CONFIG,
	getEntityThumbnailConfig,
	shouldUseFallback,
	calculateRetryDelay,
} from '@/types/thumbnails-advanced.config';
import { serverLogger } from '@/lib/logger/server-logger';

/**
 * 🔧 Servicio singleton para configuración de thumbnails
 */
class ThumbnailConfigService {
	private config: ThumbnailAdvancedConfig = DEFAULT_THUMBNAIL_ADVANCED_CONFIG;
	private subscribers: Array<(config: ThumbnailAdvancedConfig) => void> = [];

	/**
	 * Actualizar configuración
	 */
	setConfig(config: Partial<ThumbnailAdvancedConfig>) {
		this.config = { ...this.config, ...config };
		this.notifySubscribers();
	}

	/**
	 * Obtener configuración completa
	 */
	getConfig(): ThumbnailAdvancedConfig {
		return this.config;
	}

	/**
	 * Obtener configuración específica de una entidad
	 */
	getEntityConfig(entityType: keyof ThumbnailAdvancedConfig['entities']): EntityThumbnailConfig {
		return getEntityThumbnailConfig(this.config, entityType);
	}

	/**
	 * Verificar si se debe usar fallback
	 */
	shouldUseFallback(entityType: keyof ThumbnailAdvancedConfig['entities'], attemptNumber: number): boolean {
		const entityConfig = this.getEntityConfig(entityType);
		return shouldUseFallback(entityConfig.fallbackStrategy, attemptNumber);
	}

	/**
	 * Calcular delay de reintento
	 */
	calculateRetryDelay(attemptNumber: number): number {
		return calculateRetryDelay(
			this.config.retry.retryDelay,
			attemptNumber,
			this.config.retry.exponentialBackoff
		);
	}

	/**
	 * Verificar si reintentos están habilitados
	 */
	isRetryEnabled(): boolean {
		return this.config.retry.enabled;
	}

	/**
	 * Obtener número máximo de reintentos
	 */
	getMaxRetries(): number {
		return this.config.retry.maxRetries;
	}

	/**
	 * Obtener concurrencia de procesamiento
	 */
	getConcurrency(): number {
		return this.config.processing.concurrency;
	}

	/**
	 * Obtener tamaño de lote
	 */
	getBatchSize(): number {
		return this.config.processing.batchSize;
	}

	/**
	 * Verificar si logging detallado está habilitado
	 */
	isVerboseLogging(): boolean {
		return this.config.verboseLogging;
	}

	/**
	 * Verificar si se deben guardar placeholders en error
	 */
	shouldSavePlaceholders(): boolean {
		return this.config.savePlaceholdersOnError;
	}

	/**
	 * Verificar si se debe generar thumbnails durante indexación
	 */
	shouldGenerateOnIndex(): boolean {
		return this.config.generateOnIndex;
	}

	/**
	 * Suscribirse a cambios de configuración
	 */
	subscribe(callback: (config: ThumbnailAdvancedConfig) => void): () => void {
		this.subscribers.push(callback);
		return () => {
			this.subscribers = this.subscribers.filter((cb) => cb !== callback);
		};
	}

	/**
	 * Notificar a suscriptores de cambios
	 */
	private notifySubscribers() {
		for (const subscriber of this.subscribers) {
			subscriber(this.config);
		}
	}

	/**
	 * Log condicional basado en configuración
	 */
	log(message: string, ...args: unknown[]) {
		if (this.isVerboseLogging()) {
			serverLogger.debug(`[ThumbnailConfig] ${message}`, ...args);
		}
	}

	/**
	 * Reset a configuración por defecto
	 */
	reset() {
		this.config = DEFAULT_THUMBNAIL_ADVANCED_CONFIG;
		this.notifySubscribers();
	}
}

// Exportar instancia singleton
export const thumbnailConfigService = new ThumbnailConfigService();

/**
 * Hook para React (opcional, si se necesita)
 */
export function useThumbnailConfig() {
	return thumbnailConfigService;
}

/**
 * Helper para inicializar configuración desde settings
 */
export function initializeThumbnailConfig(config: ThumbnailAdvancedConfig) {
	thumbnailConfigService.setConfig(config);
}
