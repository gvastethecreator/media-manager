'use client';

/**
 * 🌈 Hook para gestionar presets de capas
 *
 * Este hook proporciona funcionalidades para trabajar con presets de capas,
 * incluyendo la selección, aplicación y guardado de presets personalizados.
 */

import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';
import {
	LAYER_PRESETS,
	type LayerPreset,
	applyPresetToConfig,
	createCustomPreset,
	getPresetById,
} from './layer-presets';

/**
 * Interfaz para el resultado del hook useLayerPresets
 */
export interface UseLayerPresetsResult {
	// Presets disponibles
	availablePresets: LayerPreset[];
	filteredPresets: LayerPreset[];
	customPresets: LayerPreset[];

	// Estado actual
	selectedPresetId: string | null;
	filterCategory: string | null;

	// Acciones
	selectPreset: (presetId: string) => void;
	applySelectedPreset: (config?: Partial<EntityCardLayerSystemConfig>) => EntityCardLayerSystemConfig;
	saveCurrentAsPreset: (
		name: string,
		description: string,
		entityTypes: string[],
		config: EntityCardLayerSystemConfig
	) => void;
	deleteCustomPreset: (presetId: string) => void;
	setFilterCategory: (category: string | null) => void;

	// Utilidades
	getPresetById: (presetId: string) => LayerPreset | undefined;
	getCategoryPresets: (category: string) => LayerPreset[];
}

/**
 * Hook para gestionar presets de capas
 */
export function useLayerPresets(entityType: string, initialPresetId?: string): UseLayerPresetsResult {
	// Estado para presets personalizados guardados
	const [customPresets, setCustomPresets] = useLocalStorage<LayerPreset[]>('entity-card-custom-presets', []);

	// Estado para el preset seleccionado
	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(initialPresetId || null);

	// Estado para filtrar por categoría
	const [filterCategory, setFilterCategory] = useState<string | null>(null);

	// Combinar presets predefinidos con personalizados
	const availablePresets = useMemo(() => {
		return [...LAYER_PRESETS, ...customPresets];
	}, [customPresets]);

	// Filtrar presets por tipo de entidad
	const entityTypePresets = useMemo(() => {
		return availablePresets.filter(
			(preset) => preset.entityTypes.includes(entityType) || preset.entityTypes.includes('all')
		);
	}, [availablePresets, entityType]);

	// Aplicar filtro de categoría si existe
	const filteredPresets = useMemo(() => {
		if (!filterCategory) return entityTypePresets;
		return entityTypePresets.filter((preset) => preset.category === filterCategory);
	}, [entityTypePresets, filterCategory]);

	// Seleccionar un preset
	const selectPreset = useCallback((presetId: string) => {
		setSelectedPresetId(presetId);
	}, []);

	// Aplicar el preset seleccionado a una configuración
	const applySelectedPreset = useCallback(
		(config?: Partial<EntityCardLayerSystemConfig>): EntityCardLayerSystemConfig => {
			if (!selectedPresetId) {
				throw new Error('No hay un preset seleccionado');
			}

			const preset = availablePresets.find((p) => p.id === selectedPresetId);
			if (!preset) {
				throw new Error(`No se encontró el preset con ID: ${selectedPresetId}`);
			}

			return applyPresetToConfig(preset, config);
		},
		[selectedPresetId, availablePresets]
	);

	// Guardar la configuración actual como un nuevo preset personalizado
	const saveCurrentAsPreset = useCallback(
		(name: string, description: string, entityTypes: string[], config: EntityCardLayerSystemConfig) => {
			const newPreset = createCustomPreset(name, description, entityTypes, config);
			setCustomPresets((prev) => [...prev, newPreset]);
			return newPreset;
		},
		[setCustomPresets]
	);

	// Eliminar un preset personalizado
	const deleteCustomPreset = useCallback(
		(presetId: string) => {
			if (!presetId.startsWith('custom-')) {
				throw new Error('Solo se pueden eliminar presets personalizados');
			}

			setCustomPresets((prev) => prev.filter((preset) => preset.id !== presetId));

			// Si el preset eliminado era el seleccionado, deseleccionar
			if (selectedPresetId === presetId) {
				setSelectedPresetId(null);
			}
		},
		[selectedPresetId, setCustomPresets]
	);

	// Obtener presets por categoría
	const getCategoryPresets = useCallback(
		(category: string) => {
			return entityTypePresets.filter((preset) => preset.category === category);
		},
		[entityTypePresets]
	);

	// Obtener un preset por su ID
	const getPresetByIdFn = useCallback(
		(presetId: string) => {
			return availablePresets.find((preset) => preset.id === presetId);
		},
		[availablePresets]
	);

	// Efecto para validar el preset inicial
	useEffect(() => {
		if (initialPresetId) {
			const preset = getPresetByIdFn(initialPresetId);
			if (!preset || (!preset.entityTypes.includes(entityType) && !preset.entityTypes.includes('all'))) {
				// Si el preset inicial no es válido para este tipo de entidad, deseleccionar
				setSelectedPresetId(null);
			}
		}
	}, [initialPresetId, entityType, getPresetByIdFn]);

	return {
		availablePresets,
		filteredPresets,
		customPresets,
		selectedPresetId,
		filterCategory,
		selectPreset,
		applySelectedPreset,
		saveCurrentAsPreset,
		deleteCustomPreset,
		setFilterCategory,
		getPresetById: getPresetByIdFn,
		getCategoryPresets,
	};
}

/**
 * Hook para aplicar un preset específico a una configuración
 */
export function useApplyPreset(
	presetId: string,
	config?: Partial<EntityCardLayerSystemConfig>
): EntityCardLayerSystemConfig | null {
	return useMemo(() => {
		const preset = getPresetById(presetId);
		if (!preset) return null;

		return applyPresetToConfig(preset, config);
	}, [presetId, config]);
}
