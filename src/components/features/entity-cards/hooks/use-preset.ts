'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EntityType } from '../adapters/preset-adapter';
import { presetService } from '../adapters/preset-adapter';
import type { CardOptions } from '../types/unified-card-types';

// Interfaz para las capas de la tarjeta
interface LayerOptions {
	items?: Array<{
		id: string;
		[key: string]: unknown;
	}>;
	order?: string[];
	layerBlending?: string;
	layerSpacing?: number;
	[key: string]: unknown;
}

// Tipo genérico para el deepMerge
type GenericRecord = Record<string, unknown>;

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
		const presetOptions = presetService.getCardOptions(presetId || null, entityType) || {};

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

		// Para evitar errores de tipo, hacemos deep clone de los objetos
		const safeTypeDefaults = structuredClone(typeDefaults);
		const safePresetOptions = structuredClone(presetOptions);
		const safeBaseOptions = structuredClone(baseOptions || {});

		// Crear una función segura para combinar objetos profundos
		const deepMerge = (target: GenericRecord, source: GenericRecord): GenericRecord => {
			const output = { ...target };

			if (source === null || source === undefined) {
				return output;
			}

			// Usar for...of en lugar de forEach
			for (const key of Object.keys(source)) {
				const sourceValue = source[key];
				if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
					if (!output[key] || typeof output[key] !== 'object') {
						output[key] = {};
					}
					output[key] = deepMerge(output[key] as GenericRecord, sourceValue as GenericRecord);
				} else if (sourceValue !== undefined) {
					output[key] = sourceValue;
				}
			}

			return output;
		};

		// Combinar los objetos de manera segura
		const combinedOptions = deepMerge(
			deepMerge(safeTypeDefaults, safePresetOptions),
			safeBaseOptions
		);

		// Manejar capas de manera especial
		if (safePresetOptions.layers?.items || safeBaseOptions.layers?.items) {
			// Normalizar para evitar acceso a propiedades de undefined
			if (!combinedOptions.layers) {
				combinedOptions.layers = {} as LayerOptions;
			}

			// Inicializar array vacío si no existe
			const layersObj = combinedOptions.layers as LayerOptions;
			if (!Array.isArray(layersObj.items)) {
				layersObj.items = [];
			}

			// Añadir items del preset si existen
			const presetLayers = safePresetOptions.layers as LayerOptions | undefined;
			if (presetLayers && Array.isArray(presetLayers.items)) {
				layersObj.items.push(...presetLayers.items);
			}

			// Añadir items de las opciones base si existen
			const baseLayers = safeBaseOptions.layers as LayerOptions | undefined;
			if (baseLayers && Array.isArray(baseLayers.items)) {
				layersObj.items.push(...baseLayers.items);
			}

			// Eliminar duplicados usando el id como criterio
			if (layersObj.items.length > 0) {
				layersObj.items = layersObj.items.filter(
					(item, index, self) =>
						item && // Asegurar que el item no es null/undefined
						index === self.findIndex((t) => t && t.id === item.id)
				);
			}
		}

		return combinedOptions as CardOptions;
	}, [baseOptions, entityType, presetId]);

	return {
		cardOptions,
		preset,
		isLoading,
		error
	};
}
