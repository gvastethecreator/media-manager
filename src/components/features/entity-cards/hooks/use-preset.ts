'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EntityType } from '../adapters/preset-adapter';
import { presetService } from '../adapters/preset-adapter';
import type { CardOptions, LayersConfig } from '../types/unified-card-types';

// Definir interfaz para el preset visual (usar la misma que en adaptadores)
export interface VisualPreset {
	id?: string;
	name: string;
	description?: string | null;
	category: string;
	isDefault?: boolean;
	isPublic?: boolean;
	author?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;

	// Configuraciones serializadas
	coreConfig?: string | null;
	designConfig?: string | null;
	animationConfig?: string | null;
	layerConfig?: string | null;
	backsideConfig?: string | null;
	effectsConfig?: string | null;
	performanceConfig?: string | null;
	colorConfig?: string | null;
	imageGridConfig?: string | null;
	layoutConfig?: string | null;
	explodeConfig?: string | null;
	previewConfig?: string | null;
	rarityConfig?: string | null;

	// Configuraciones específicas por tipo de entidad
	folderConfig?: string | null;
	imageConfig?: string | null;
	videoConfig?: string | null;
	albumConfig?: string | null;
	tagConfig?: string | null;
	collectionConfig?: string | null;
	characterConfig?: string | null;
	placeConfig?: string | null;
	worldItemConfig?: string | null;
	conceptConfig?: string | null;
	promptConfig?: string | null;
	noteConfig?: string | null;
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
			// Convertir el preset a formato compatible con VisualPreset
			const adaptedPreset: VisualPreset = {
				id: cachedPreset.id,
				name: cachedPreset.name,
				description: cachedPreset.description,
				category: cachedPreset.category,
				// Añadir el resto de propiedades según sea necesario
				coreConfig: cachedPreset.coreConfig || null,
				designConfig: cachedPreset.designConfig || null,
				animationConfig: cachedPreset.animationConfig || null,
				layerConfig: cachedPreset.layerConfig || null,
				backsideConfig: cachedPreset.backsideConfig || null,
				effectsConfig: cachedPreset.effectsConfig || null,
				performanceConfig: cachedPreset.performanceConfig || null,
				colorConfig: cachedPreset.colorConfig || null,
				imageGridConfig: cachedPreset.imageGridConfig || null,
				layoutConfig: cachedPreset.layoutConfig || null,
				explodeConfig: cachedPreset.explodeConfig || null,
				previewConfig: cachedPreset.previewConfig || null,
				rarityConfig: cachedPreset.rarityConfig || null,
				folderConfig: cachedPreset.folderConfig || null,
				imageConfig: cachedPreset.imageConfig || null,
				videoConfig: cachedPreset.videoConfig || null,
				albumConfig: cachedPreset.albumConfig || null,
				tagConfig: cachedPreset.tagConfig || null,
				collectionConfig: cachedPreset.collectionConfig || null,
				characterConfig: cachedPreset.characterConfig || null,
				placeConfig: cachedPreset.placeConfig || null,
				worldItemConfig: cachedPreset.worldItemConfig || null,
				conceptConfig: cachedPreset.conceptConfig || null,
				promptConfig: cachedPreset.promptConfig || null,
				noteConfig: cachedPreset.noteConfig || null,
			};

			setPreset(adaptedPreset);
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

		// Opciones por defecto específicas para el tipo de entidad
		const defaultTypeOptions = {
			folder: {
				designSystem: {
					preset: 'folder',
					variant: 'default',
					aspectRatio: '7/10',
					cornerStyle: 'rounded',
					cornerRadius: 12,
					elevation: 2,
					shadowStyle: 'soft',
				},
				layers: {
					order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
					layerBlending: 'screen',
					layerSpacing: 2,
				},
			},
			album: {
				designSystem: {
					preset: 'album',
					variant: 'default',
					aspectRatio: '1/1',
				},
			},
			tag: {
				designSystem: {
					preset: 'tag',
					variant: 'default',
					aspectRatio: '3/1',
				},
			},
			// Añadir más tipos según sea necesario
		};

		// Obtener opciones por defecto para el tipo de entidad actual
		const typeDefaults = defaultTypeOptions[entityType as keyof typeof defaultTypeOptions] || {};

		// Combinar con las opciones base de manera profunda
		return {
			// Primero las opciones por defecto del tipo
			...typeDefaults,
			// Luego las opciones del preset
			...presetOptions,
			// Finalmente las opciones base proporcionadas
			...baseOptions,
			// Asegurar que las opciones anidadas se combinen correctamente
			designSystem: {
				...(typeDefaults.designSystem || {}),
				...(presetOptions.designSystem || {}),
				...(baseOptions.designSystem || {}),
			},
			colors: {
				...((presetOptions.colors as Record<string, unknown>) || {}),
				...((baseOptions.colors as Record<string, unknown>) || {}),
			},
			effects: {
				...((presetOptions.effects as Record<string, unknown>) || {}),
				...((baseOptions.effects as Record<string, unknown>) || {}),
			},
			// Asegurar que las opciones de capas específicas se combinen correctamente
			layers: {
				...(typeDefaults.layers || {}),
				...((presetOptions.layers || {}) as Partial<LayersConfig>),
				...((baseOptions.layers || {}) as Partial<LayersConfig>),
				// Combinamos items si existen en ambas configuraciones
				...(presetOptions.layers?.items || baseOptions.layers?.items
					? {
							items: [
								...((presetOptions.layers?.items as any[]) || []),
								...((baseOptions.layers?.items as any[]) || []),
							].filter(
								(item, index, self) =>
									// Eliminar duplicados usando el id como criterio
									index === self.findIndex((t) => t.id === item.id)
							),
					  }
					: {}),
			},
		} as CardOptions;
	}, [entityType, presetId, baseOptions]);

	return {
		cardOptions,
		preset,
		isLoading,
		error,
	};
}
