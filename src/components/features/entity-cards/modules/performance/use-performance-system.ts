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

	return {
		options,
		updateOption,
		resetOptions,
		applyPreset,
	};
}
