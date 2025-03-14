'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FOLDER_OPTIONS, type FolderOptions } from './types';

/**
 * Hook para gestionar el sistema de carpetas
 * @param initialOptions - Opciones iniciales de carpeta
 * @param onChange - Callback que se ejecuta cuando cambian las opciones
 * @returns Un objeto con las opciones actuales y funciones para manipularlas
 */
export function useFolderSystem(initialOptions?: Partial<FolderOptions>, onChange?: (options: FolderOptions) => void) {
	// Estado para las opciones de carpeta
	const [options, setOptions] = useState<FolderOptions>({
		...DEFAULT_FOLDER_OPTIONS,
		...initialOptions,
	});

	// Efecto para notificar cambios en las opciones
	useEffect(() => {
		onChange?.(options);
	}, [options, onChange]);

	// Función para actualizar configuración de carpeta
	const updateCoreFolderConfig = useCallback((key: string, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			coreFolderConfig: {
				...prev.coreFolderConfig,
				[key]: value,
			},
		}));
	}, []);

	// Función para actualizar sistema de capas
	const updateCoreLayerSystem = useCallback((key: string, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			coreLayerSystem: {
				...prev.coreLayerSystem,
				[key]: value,
			},
		}));
	}, []);

	// Función para actualizar rendimiento
	const updateCorePerformance = useCallback((key: string, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			corePerformance: {
				...prev.corePerformance,
				[key]: value,
			},
		}));
	}, []);

	// Función para actualizar efectos
	const updateCoreEffects = useCallback((effectType: string, key: string, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			coreEffects: {
				...prev.coreEffects,
				[effectType]: {
					...prev.coreEffects?.[effectType as keyof typeof prev.coreEffects],
					[key]: value,
				},
			},
		}));
	}, []);

	// Función para actualizar configuración general
	const updateCoreConfig = useCallback((key: string, value: unknown) => {
		setOptions((prev) => ({
			...prev,
			coreConfig: {
				...prev.coreConfig,
				[key]: value,
			},
		}));
	}, []);

	// Función para resetear todas las opciones a los valores predeterminados
	const resetOptions = useCallback(() => {
		setOptions(DEFAULT_FOLDER_OPTIONS);
	}, []);

	return {
		options,
		updateCoreFolderConfig,
		updateCoreLayerSystem,
		updateCorePerformance,
		updateCoreEffects,
		updateCoreConfig,
		resetOptions,
	};
}
