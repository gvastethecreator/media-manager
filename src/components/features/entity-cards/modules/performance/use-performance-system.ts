'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PERFORMANCE_OPTIONS, type PerformanceOptions } from './types';

/**
 * Hook para gestionar el sistema de rendimiento
 * @param initialOptions - Opciones iniciales de rendimiento
 * @param onChange - Callback que se ejecuta cuando cambian las opciones
 * @returns Un objeto con las opciones actuales y funciones para manipularlas
 */
export function usePerformanceSystem(
	initialOptions?: Partial<PerformanceOptions>,
	onChange?: (options: PerformanceOptions) => void
) {
	// Estado para las opciones de rendimiento
	const [options, setOptions] = useState<PerformanceOptions>({
		...DEFAULT_PERFORMANCE_OPTIONS,
		...initialOptions,
	});

	// Efecto para notificar cambios en las opciones
	useEffect(() => {
		onChange?.(options);
	}, [options, onChange]);

	// Función para actualizar una opción específica
	const updateOption = useCallback((key: keyof PerformanceOptions, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	// Función para resetear todas las opciones a los valores predeterminados
	const resetOptions = useCallback(() => {
		setOptions(DEFAULT_PERFORMANCE_OPTIONS);
	}, []);

	// Función para aplicar un preset de rendimiento
	const applyPreset = useCallback((presetName: 'quality' | 'balanced' | 'performance') => {
		let preset: Partial<PerformanceOptions> = {};

		switch (presetName) {
			case 'quality':
				preset = {
					performanceMode: 'quality',
					enableHardwareAcceleration: true,
					imageOptimization: true,
					lazyLoad: false,
					prefetch: true,
					virtualizeList: false,
					animationMaxFPS: 60,
				};
				break;
			case 'balanced':
				preset = {
					...DEFAULT_PERFORMANCE_OPTIONS,
					performanceMode: 'balanced',
				};
				break;
			case 'performance':
				preset = {
					performanceMode: 'performance',
					enableCache: true,
					loadingStrategy: 'lazy',
					enablePreloading: false,
					lazyLoad: true,
					virtualizeList: true,
					imageOptimization: true,
					reducedMotion: true,
					animationMaxFPS: 30,
				};
				break;
		}

		setOptions((prev) => ({
			...prev,
			...preset,
		}));
	}, []);

	// Función para verificar si la opción de hardware acceleration está disponible
	const checkHardwareAcceleration = useCallback(() => {
		// Verificar si el navegador soporta aceleración por hardware
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (!gl) {
			// WebGL no disponible, deshabilitar aceleración por hardware
			updateOption('enableHardwareAcceleration', false);
			return false;
		}

		return true;
	}, [updateOption]);

	// Función para verificar si el dispositivo tiene preferencias de reducción de movimiento
	const checkReducedMotionPreference = useCallback(() => {
		if (typeof window !== 'undefined') {
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			if (prefersReducedMotion && options.reducedMotion !== true) {
				updateOption('reducedMotion', true);
				return true;
			}
		}
		return options.reducedMotion === true;
	}, [options.reducedMotion, updateOption]);

	// Función para adaptar automáticamente las opciones según el dispositivo
	const adaptToDevice = useCallback(() => {
		// Detectar tipo de dispositivo
		const isMobile =
			typeof window !== 'undefined' &&
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

		// Detectar conexión lenta
		const isSlowConnection =
			typeof navigator !== 'undefined' &&
			navigator.connection &&
			(navigator.connection.saveData ||
				(navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g')));

		// Adaptar según el dispositivo y conexión
		if (isMobile || isSlowConnection) {
			const mobilePreset: Partial<PerformanceOptions> = {
				lazyLoad: true,
				virtualizeList: true,
				imageOptimization: true,
				throttleMs: 200,
				debounceTime: 500,
				animationMaxFPS: 30,
				cacheStrategy: 'memory',
			};

			setOptions((prev) => ({
				...prev,
				...mobilePreset,
			}));

			return true;
		}

		return false;
	}, []);

	// Función para obtener el impacto en rendimiento de cada opción
	const getPerformanceImpact = useCallback(() => {
		const impact = {
			high: [] as Array<keyof PerformanceOptions>,
			medium: [] as Array<keyof PerformanceOptions>,
			low: [] as Array<keyof PerformanceOptions>,
		};

		// Opciones de alto impacto
		if (!options.lazyLoad) impact.high.push('lazyLoad');
		if (!options.virtualizeList && options.virtualizeList !== undefined) impact.high.push('virtualizeList');
		if (!options.imageOptimization) impact.high.push('imageOptimization');

		// Opciones de impacto medio
		if (!options.batchUpdates) impact.medium.push('batchUpdates');
		if (options.animationMaxFPS && options.animationMaxFPS > 60) impact.medium.push('animationMaxFPS');
		if (!options.enableCache) impact.medium.push('enableCache');

		// Opciones de bajo impacto
		if (!options.useRAF) impact.low.push('useRAF');
		if (options.throttleMs && options.throttleMs < 100) impact.low.push('throttleMs');

		return impact;
	}, [options]);

	// Función para obtener recomendaciones de rendimiento
	const getPerformanceRecommendations = useCallback(() => {
		const impact = getPerformanceImpact();
		const recommendations: Record<string, string> = {};

		// Generar recomendaciones basadas en el impacto
		impact.high.forEach((option) => {
			switch (option) {
				case 'lazyLoad':
					recommendations.lazyLoad =
						'Habilitar la carga diferida para mejorar significativamente el rendimiento inicial';
					break;
				case 'virtualizeList':
					recommendations.virtualizeList =
						'Habilitar la virtualización de listas para mejorar el rendimiento con muchas tarjetas';
					break;
				case 'imageOptimization':
					recommendations.imageOptimization =
						'Habilitar la optimización de imágenes para reducir el consumo de memoria y mejorar los tiempos de carga';
					break;
			}
		});

		impact.medium.forEach((option) => {
			switch (option) {
				case 'batchUpdates':
					recommendations.batchUpdates = 'Habilitar el procesamiento por lotes para reducir el número de renderizados';
					break;
				case 'animationMaxFPS':
					recommendations.animationMaxFPS =
						'Reducir el máximo de FPS para animaciones a 60 o menos para ahorrar recursos';
					break;
				case 'enableCache':
					recommendations.enableCache =
						'Habilitar el caché para mejorar los tiempos de carga en navegaciones repetidas';
					break;
			}
		});

		return recommendations;
	}, [getPerformanceImpact]);

	// Función para aplicar optimizaciones automáticas basadas en el rendimiento actual
	const applyAutoOptimizations = useCallback(() => {
		// Detectar rendimiento del dispositivo
		let isLowPerfDevice = false;

		// Si está disponible, usar hardwareConcurrency como indicador
		if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
			isLowPerfDevice = navigator.hardwareConcurrency <= 4;
		}

		// Comprobar si el dispositivo tiene memoria limitada
		if (typeof navigator !== 'undefined') {
			// @ts-expect-error - La propiedad deviceMemory no está en todos los navegadores
			if (navigator.deviceMemory) {
				// @ts-expect-error - La propiedad deviceMemory no está en todos los navegadores
				isLowPerfDevice = isLowPerfDevice || navigator.deviceMemory <= 4;
			}
		}

		if (isLowPerfDevice) {
			// Aplicar optimizaciones para dispositivos de bajo rendimiento
			const lowPerfOptimizations: Partial<PerformanceOptions> = {
				reducedMotion: true,
				animationMaxFPS: 30,
				lazyLoad: true,
				virtualizeList: true,
				throttleMs: 200,
				imageOptimization: true,
				performanceMode: 'performance',
			};

			setOptions((prev) => ({
				...prev,
				...lowPerfOptimizations,
			}));

			return true;
		}

		return false;
	}, []);

	// Efecto para verificar capacidades del dispositivo al montar
	useEffect(() => {
		if (typeof window !== 'undefined') {
			checkHardwareAcceleration();
			checkReducedMotionPreference();
		}
	}, [checkHardwareAcceleration, checkReducedMotionPreference]);

	return {
		// Estado
		options,

		// Métodos para manipular el estado
		updateOption,
		resetOptions,
		applyPreset,

		// Métodos para análisis y recomendación
		getPerformanceImpact,
		getPerformanceRecommendations,

		// Métodos de adaptación automática
		adaptToDevice,
		applyAutoOptimizations,
		checkHardwareAcceleration,
		checkReducedMotionPreference,
	};
}
