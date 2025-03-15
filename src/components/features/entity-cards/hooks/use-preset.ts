'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EntityType } from '../adapters/preset-adapter';
import { presetService } from '../adapters/preset-adapter';
import type { CardOptions } from '../types/card-settings-types';

// Definir interfaz para el preset visual (usar la misma que en adaptadores)
export interface VisualPreset {
	id?: string;
	name: string;
	description?: string;
	category: string;
	isDefault?: boolean;
	isPublic?: boolean;
	author?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;

	// Configuraciones serializadas
	coreConfig?: string;
	designConfig?: string;
	animationConfig?: string;
	layerConfig?: string;
	backsideConfig?: string;
	effectsConfig?: string;
	performanceConfig?: string;
	colorConfig?: string;
	imageGridConfig?: string;
	layoutConfig?: string;
	explodeConfig?: string;
	previewConfig?: string;
	rarityConfig?: string;

	// Configuraciones específicas por tipo de entidad
	folderConfig?: string;
	imageConfig?: string;
	videoConfig?: string;
	albumConfig?: string;
	tagConfig?: string;
	collectionConfig?: string;
	characterConfig?: string;
	placeConfig?: string;
	worldItemConfig?: string;
	conceptConfig?: string;
	promptConfig?: string;
	noteConfig?: string;
}

export interface UsePresetOptions {
	entityType: EntityType;
	entityId?: string | null;
	presetId?: string | null;
	baseOptions?: Partial<CardOptions>;
}

export interface UsePresetResult {
	cardOptions: CardOptions;
	preset: VisualPreset | null;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook para obtener y gestionar presets visuales
 *
 * Este hook:
 * 1. Carga el preset desde el servidor si es necesario
 * 2. Adapta el preset a opciones de tarjeta
 * 3. Combina con opciones base proporcionadas
 */
export function usePreset({ entityType, entityId, presetId, baseOptions = {} }: UsePresetOptions): UsePresetResult {
	const [preset, setPreset] = useState<VisualPreset | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Cargar el preset del servidor si no está en la caché
	useEffect(() => {
		if (!presetId) {
			return;
		}

		const cachedPreset = presetService.getPreset(presetId);
		if (cachedPreset) {
			setPreset(cachedPreset);
			return;
		}

		// Si no está en caché, cargarlo del servidor
		async function loadPreset() {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/presets/${presetId}`);
				if (!response.ok) {
					throw new Error('Error al cargar el preset');
				}
				const data = await response.json();
				presetService.registerPreset(data);
				setPreset(data);
			} catch (err) {
				setError(err instanceof Error ? err : new Error('Error desconocido'));
				console.error('Error al cargar el preset:', err);
			} finally {
				setIsLoading(false);
			}
		}

		loadPreset();
	}, [presetId]);

	// Componer las opciones de la tarjeta
	const cardOptions = useMemo(() => {
		// Obtener opciones del preset
		const presetOptions = presetService.getCardOptions(presetId || null, entityType);

		// Combinar con las opciones base de manera profunda
		return {
			...presetOptions,
			...baseOptions,
			// Asegurar que las opciones anidadas se combinen correctamente
			designSystem: {
				...(presetOptions.designSystem || {}),
				...(baseOptions.designSystem || {}),
			},
			colors: {
				...(presetOptions.colors || {}),
				...(baseOptions.colors || {}),
			},
			effects: {
				...(presetOptions.effects || {}),
				...(baseOptions.effects || {}),
			},
			// Asegurar que las opciones de capas específicas se combinen correctamente
			layers: {
				...(presetOptions.layers || {}),
				...(baseOptions.layers || {}),
				items: [
					...(presetOptions.layers?.items || []),
					...(baseOptions.layers?.items || []),
				].filter((item, index, self) =>
					// Eliminar duplicados usando el id como criterio
					index === self.findIndex(t => t.id === item.id)
				)
			}
		} as CardOptions;
	}, [entityType, presetId, baseOptions, preset]);

	return {
		cardOptions,
		preset,
		isLoading,
		error,
	};
}
