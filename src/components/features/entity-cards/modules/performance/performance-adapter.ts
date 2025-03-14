'use client';

import type { CardOptions } from '../../settings/types';
import type { PerformanceOptions } from './types';

/**
 * Convierte las opciones de rendimiento del formato legacy al nuevo formato
 * @param cardOptions - Opciones de la tarjeta en formato antiguo
 * @returns Opciones de rendimiento en el nuevo formato
 */
export function legacyToPerformanceOptions(cardOptions: CardOptions): PerformanceOptions {
	// Obtenemos las opciones de Core, si existen
	const corePerformance = cardOptions.core?.performance || {};

	// Obtenemos las opciones legacy
	const legacyPerformance = cardOptions.performance || {};

	// Combinamos priorizando las opciones de Core
	return {
		// Propiedades ya migradas a Core
		performanceMode: cardOptions.core?.performanceMode || 'balanced',
		enableCache: cardOptions.core?.enableCache ?? true,
		loadingStrategy: cardOptions.core?.loadingStrategy || 'progressive',
		enablePreloading: cardOptions.core?.enablePreloading ?? true,

		// Propiedades en performance
		enableHardwareAcceleration:
			corePerformance.enableHardwareAcceleration ?? legacyPerformance.enableHardwareAcceleration ?? true,
		useRAF: corePerformance.useRAF ?? legacyPerformance.useRAF ?? true,
		batchUpdates: corePerformance.batchUpdates ?? legacyPerformance.batchUpdates ?? true,
		throttleMs: corePerformance.throttleMs ?? legacyPerformance.throttleMs ?? 16,
		lazyLoad: corePerformance.lazyLoad ?? legacyPerformance.lazyLoad ?? true,
		prefetch: corePerformance.prefetch ?? legacyPerformance.prefetch ?? false,
		imageOptimization: corePerformance.imageOptimization ?? legacyPerformance.imageOptimization ?? true,
		prefetchOnHover: corePerformance.prefetchOnHover ?? legacyPerformance.prefetchOnHover ?? false,
		debounceTime: corePerformance.debounceTime ?? legacyPerformance.debounceTime ?? 200,
		transitionDelay: corePerformance.transitionDelay ?? legacyPerformance.transitionDelay ?? 0,
		virtualizeList: corePerformance.virtualizeList ?? legacyPerformance.virtualizeList ?? false,
		cacheStrategy: corePerformance.cacheStrategy ?? legacyPerformance.cacheStrategy ?? 'memory',
		useWASM: corePerformance.useWASM ?? legacyPerformance.useWASM ?? false,
		reducedMotion: corePerformance.reducedMotion ?? legacyPerformance.reducedMotion ?? false,
		animationDuration: corePerformance.animationDuration ?? legacyPerformance.animationDuration ?? 300,
		animationMaxFPS: corePerformance.animationMaxFPS ?? legacyPerformance.animationMaxFPS ?? 60,
	};
}

/**
 * Actualiza las opciones de la tarjeta con las nuevas opciones de rendimiento
 * @param cardOptions - Opciones actuales de la tarjeta
 * @param performanceOptions - Nuevas opciones de rendimiento
 * @returns Opciones actualizadas de la tarjeta
 */
export function updateCardWithPerformanceOptions(
	cardOptions: CardOptions,
	performanceOptions: PerformanceOptions
): CardOptions {
	// Extraemos las propiedades que van directamente en core
	const { performanceMode, enableCache, loadingStrategy, enablePreloading, ...restPerformanceOptions } =
		performanceOptions;

	// Creamos el nuevo objeto de opciones
	return {
		...cardOptions,
		// Actualizamos core
		core: {
			...cardOptions.core,
			performanceMode,
			enableCache,
			loadingStrategy,
			enablePreloading,
			// Y también el objeto performance dentro de core
			performance: {
				...cardOptions.core?.performance,
				...restPerformanceOptions,
			},
		},
		// Mantenemos compatibilidad con el sistema antiguo
		performance: {
			...cardOptions.performance,
			...restPerformanceOptions,
		},
	};
}
