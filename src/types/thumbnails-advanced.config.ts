/**
 * @file Configuración avanzada de thumbnails
 * @module types/thumbnails-advanced-config
 * @description Tipos y configuración avanzada para el sistema de generación de thumbnails
 */

import { z } from 'zod';

/**
 * 🎯 Estrategia de fallback para generación de thumbnails
 */
export enum ThumbnailFallbackStrategy {
	/** Intentar todos los fallbacks disponibles */
	AGGRESSIVE = 'aggressive',
	/** Intentar solo el primer fallback */
	CONSERVATIVE = 'conservative',
	/** No usar fallbacks, fallar inmediatamente */
	NONE = 'none',
}

/**
 * 🔄 Configuración de reintentos
 */
export interface ThumbnailRetryConfig {
	/** Habilitar reintentos automáticos */
	enabled: boolean;
	/** Número máximo de reintentos */
	maxRetries: number;
	/** Delay entre reintentos en ms */
	retryDelay: number;
	/** Usar backoff exponencial */
	exponentialBackoff: boolean;
}

/**
 * ⚙️ Configuración específica por tipo de entidad
 */
export interface EntityThumbnailConfig {
	/** Timeout en segundos */
	timeout: number;
	/** Habilitar generación para este tipo */
	enabled: boolean;
	/** Estrategia de fallback */
	fallbackStrategy: ThumbnailFallbackStrategy;
	/** Formato preferido de salida */
	preferredFormat: 'webp' | 'jpeg' | 'png' | 'svg';
}

/**
 * 🚀 Configuración de procesamiento
 */
export interface ThumbnailProcessingConfig {
	/** Número de workers concurrentes */
	concurrency: number;
	/** Tamaño de lote para procesamiento masivo */
	batchSize: number;
	/** Priorizar archivos recientes */
	prioritizeRecent: boolean;
	/** Pausar procesamiento bajo carga alta */
	pauseOnHighLoad: boolean;
	/** Threshold de CPU para pausar (%) */
	cpuThreshold: number;
}

/**
 * 📊 Configuración avanzada completa de thumbnails
 */
export interface ThumbnailAdvancedConfig {
	/** Configuración de reintentos */
	retry: ThumbnailRetryConfig;
	
	/** Configuración de procesamiento */
	processing: ThumbnailProcessingConfig;
	
	/** Configuración por tipo de entidad */
	entities: {
		video: EntityThumbnailConfig;
		audio: EntityThumbnailConfig;
		image: EntityThumbnailConfig;
		document: EntityThumbnailConfig;
		jsonFile: EntityThumbnailConfig;
		file3d: EntityThumbnailConfig;
	};
	
	/** Habilitar logging detallado */
	verboseLogging: boolean;
	
	/** Generar thumbnails durante indexación inicial */
	generateOnIndex: boolean;
	
	/** Guardar placeholders en caso de fallo */
	savePlaceholdersOnError: boolean;
	
	/** Limpiar thumbnails huérfanos automáticamente */
	autoCleanOrphans: boolean;
	
	/** Intervalo de limpieza automática en horas (0 = deshabilitado) */
	autoCleanInterval: number;
}

/**
 * 🎨 Configuración por defecto
 */
export const DEFAULT_THUMBNAIL_ADVANCED_CONFIG: ThumbnailAdvancedConfig = {
	retry: {
		enabled: true,
		maxRetries: 3,
		retryDelay: 1000,
		exponentialBackoff: true,
	},
	processing: {
		concurrency: 4,
		batchSize: 50,
		prioritizeRecent: true,
		pauseOnHighLoad: false,
		cpuThreshold: 80,
	},
	entities: {
		video: {
			timeout: 30,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.AGGRESSIVE,
			preferredFormat: 'webp',
		},
		audio: {
			timeout: 15,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.AGGRESSIVE,
			preferredFormat: 'png',
		},
		image: {
			timeout: 10,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.CONSERVATIVE,
			preferredFormat: 'webp',
		},
		document: {
			timeout: 20,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.AGGRESSIVE,
			preferredFormat: 'png',
		},
		jsonFile: {
			timeout: 10,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.AGGRESSIVE,
			preferredFormat: 'svg',
		},
		file3d: {
			timeout: 25,
			enabled: true,
			fallbackStrategy: ThumbnailFallbackStrategy.AGGRESSIVE,
			preferredFormat: 'png',
		},
	},
	verboseLogging: false,
	generateOnIndex: true,
	savePlaceholdersOnError: true,
	autoCleanOrphans: false,
	autoCleanInterval: 0,
};

/**
 * 📝 Schemas de validación con Zod
 */
export const ThumbnailFallbackStrategySchema = z.nativeEnum(ThumbnailFallbackStrategy);

export const ThumbnailRetryConfigSchema = z.object({
	enabled: z.boolean(),
	maxRetries: z.number().int().min(0).max(10),
	retryDelay: z.number().int().min(100).max(10000),
	exponentialBackoff: z.boolean(),
});

export const EntityThumbnailConfigSchema = z.object({
	timeout: z.number().int().min(5).max(120),
	enabled: z.boolean(),
	fallbackStrategy: ThumbnailFallbackStrategySchema,
	preferredFormat: z.enum(['webp', 'jpeg', 'png', 'svg']),
});

export const ThumbnailProcessingConfigSchema = z.object({
	concurrency: z.number().int().min(1).max(16),
	batchSize: z.number().int().min(10).max(500),
	prioritizeRecent: z.boolean(),
	pauseOnHighLoad: z.boolean(),
	cpuThreshold: z.number().int().min(50).max(95),
});

export const ThumbnailAdvancedConfigSchema = z.object({
	retry: ThumbnailRetryConfigSchema,
	processing: ThumbnailProcessingConfigSchema,
	entities: z.object({
		video: EntityThumbnailConfigSchema,
		audio: EntityThumbnailConfigSchema,
		image: EntityThumbnailConfigSchema,
		document: EntityThumbnailConfigSchema,
		jsonFile: EntityThumbnailConfigSchema,
		file3d: EntityThumbnailConfigSchema,
	}),
	verboseLogging: z.boolean(),
	generateOnIndex: z.boolean(),
	savePlaceholdersOnError: z.boolean(),
	autoCleanOrphans: z.boolean(),
	autoCleanInterval: z.number().int().min(0).max(168), // Max 1 semana
});

/**
 * 🔧 Helpers para obtener configuración específica
 */
export function getEntityThumbnailConfig(
	config: ThumbnailAdvancedConfig,
	entityType: keyof ThumbnailAdvancedConfig['entities']
): EntityThumbnailConfig {
	return config.entities[entityType] || config.entities.image;
}

export function shouldUseFallback(
	strategy: ThumbnailFallbackStrategy,
	attemptNumber: number
): boolean {
	switch (strategy) {
		case ThumbnailFallbackStrategy.AGGRESSIVE:
			return true;
		case ThumbnailFallbackStrategy.CONSERVATIVE:
			return attemptNumber === 0;
		case ThumbnailFallbackStrategy.NONE:
			return false;
		default:
			return false;
	}
}

export function calculateRetryDelay(
	baseDelay: number,
	attemptNumber: number,
	useExponential: boolean
): number {
	if (!useExponential) {
		return baseDelay;
	}
	return baseDelay * Math.pow(2, attemptNumber);
}
