'use client';

import type { Album } from '@/types/entities/albums';
import type { Character } from '@/types/entities/characters';
import type { Collection } from '@/types/entities/collections';
import type { Concept } from '@/types/entities/concepts';
import type { Folder } from '@/types/entities/folders';
import type { Note } from '@/types/entities/notes';
import type { Place } from '@/types/entities/places';
import type { Prompt } from '@/types/entities/prompts';
import type { Tag } from '@/types/entities/tags';
import type { WorldItem } from '@/types/entities/world-items';

import { getCardOptionsFromPreset } from '../actions/visual-presets.actions';
// Importamos todos los adaptadores de tarjeta
import { AlbumCard } from '../layouts/album-card-layout';
import { CharacterCard } from '../layouts/character-card-layout';
import { CollectionCard } from '../layouts/collection-card-layout';
import { ConceptCard } from '../layouts/concept-card-layout';
import { FolderCard } from '../layouts/folder-card-layout';
import { NoteCard } from '../layouts/note-card-layout';
import { PlaceCard } from '../layouts/place-card-layout';
import { PromptCard } from '../layouts/prompt-card-layout';
import { TagsCard } from '../layouts/tags-card-layout';
import { WorldItemAdapter } from './world-item-adapter';

import React, { useEffect, useState } from 'react';
import type { CardOptions } from '../types/unified-card-types';

// Extendemos los tipos base para incluir presetId
interface EntityBase {
	presetId?: string;
}

// Tipo de unión para todas las entidades posibles con presetId opcional
export type Entity = (Folder | Album | Tag | Collection | Character | Place | WorldItem | Concept | Prompt | Note) & EntityBase;

// Tipo extendido para tipos específicos que necesitan más propiedades
export interface CharacterExtended extends Character {
	stats: CharacterStats | undefined;
	presetId?: string;
}

export interface ExtendedConcept extends Concept {
	presetId: string;
}

export interface ExtendedNote extends Note {
	presetId: string;
}

export interface ExtendedPrompt extends Prompt {
	_count: {
		uses: number;
	} | undefined;
	presetId?: string;
}

// Estructura para las estadísticas de personajes
export interface CharacterStats {
	// Define aquí la estructura de stats para Character
	strength?: number;
	dexterity?: number;
	constitution?: number;
	intelligence?: number;
	wisdom?: number;
	charisma?: number;
	// otros stats...
}

export interface EntityCardAdapterProps {
	entityType: string;
	entity: Entity;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
}

/**
 * Genera una configuración de rareza para una entidad
 * @param level El nivel de rareza
 * @param color El color base (opcional)
 * @returns La configuración de rareza
 */
export function generateRarityConfig(level: string, color = '#3b82f6') {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}

/**
 * Carga la configuración de un preset visual para una entidad
 * @param entity La entidad con posible presetId
 * @param entityType El tipo de entidad
 * @param defaultOptions Opciones predeterminadas si no hay preset
 * @returns Promise con las opciones de tarjeta
 */
async function loadEntityPresetConfig(
	entity: Entity,
	entityType: string,
	defaultOptions: CardOptions
): Promise<CardOptions> {
	// Si la entidad no tiene un presetId, devolver opciones predeterminadas
	if (!entity.presetId) {
		return defaultOptions;
	}

	try {
		// Intentar cargar el preset desde la API
		const response = await getCardOptionsFromPreset(entity.presetId, entityType);

		if (response?.success && response.data) {
			// Combinar con las opciones predeterminadas para asegurar que todos los campos existan
			return {
				...defaultOptions,
				...(response.data as CardOptions),
				// Preservar sistemas anidados
				designSystem: {
					...(defaultOptions.designSystem || {}),
					...((response.data as CardOptions).designSystem || {}),
				},
				layerSystem: {
					...(defaultOptions.layerSystem || {}),
					...((response.data as CardOptions).layerSystem || {}),
				},
			};
		}
	} catch (error) {
		console.error(`Error al cargar preset ${entity.presetId} para entidad tipo ${entityType}:`, error);
	}

	// Si hay algún error o el preset no existe, devolver opciones predeterminadas
	return defaultOptions;
}

/**
 * Adaptador genérico para cualquier tipo de entidad
 * Selecciona el layout apropiado según el tipo de entidad
 */
export const EntityCardAdapter = React.memo(
	function EntityCardAdapterInner({
		entityType,
		entity,
		options = {},
		onClick,
		showVisualConfig = false,
		onVisualConfigClick,
		enableExplode = false,
		isExploded,
		activeLayer,
		onExplodedChange,
		onActiveLayerChange,
		className,
	}: EntityCardAdapterProps) {
		// Estado para almacenar las opciones finales de la tarjeta (combinando defaults, presets y override)
		const [cardOptions, setCardOptions] = useState<CardOptions | null>(null);
		// Estado para controlar si se está cargando el preset
		const [isLoadingPreset, setIsLoadingPreset] = useState(!!entity.presetId);

		// Efecto para cargar el preset si la entidad tiene uno
		useEffect(() => {
			// Solo cargar el preset si la entidad tiene un presetId
			if (entity?.presetId) {
				setIsLoadingPreset(true);

				// Valores por defecto basados en las opciones proporcionadas
				const defaultOptions = options as CardOptions;

				// Cargar el preset
				loadEntityPresetConfig(entity, entityType, defaultOptions)
					.then(presetOptions => {
						// Actualizar las opciones con las del preset
						setCardOptions(presetOptions);
					})
					.catch(error => {
						console.error('Error cargando preset para tarjeta de entidad:', error);
						// En caso de error, usar las opciones proporcionadas
						setCardOptions(defaultOptions);
					})
					.finally(() => {
						setIsLoadingPreset(false);
					});
			} else {
				// Si no hay presetId, usar las opciones proporcionadas directamente
				setCardOptions(options as CardOptions);
				setIsLoadingPreset(false);
			}
		}, [entity, entity.presetId, entityType, options]);

		// Verificar que la entidad existe
		if (!entity) {
			console.error(`Error: La entidad de tipo ${entityType} es undefined`);
			return (
				<div className="error-card p-4 border border-red-500 rounded-md">
					<h3 className="text-red-500 font-medium">Error de datos</h3>
					<p className="text-sm text-gray-500">No se pudo cargar la información de la entidad</p>
				</div>
			);
		}

		// Si el preset está cargando, mostrar una versión simplificada de la tarjeta
		if (isLoadingPreset) {
			return (
				<div className="loading-card p-4 border border-muted rounded-md animate-pulse">
					<div className="h-32 bg-muted/30 rounded-md mb-2" />
					<div className="h-4 w-2/3 bg-muted/30 rounded-md" />
					<div className="h-3 w-1/2 bg-muted/30 rounded-md mt-2" />
				</div>
			);
		}

		// Pasamos las propiedades comunes a todos los tipos de tarjetas
		const commonProps = {
			onClick,
			className,
			showVisualConfig,
			onVisualConfigClick,
			enableExplode,
			isExploded,
			activeLayer,
			onExplodedChange,
			onActiveLayerChange,
			options: cardOptions as CardOptions,
		};

		// Renderizamos el adaptador según el tipo de entidad
		switch (entityType) {
			case 'folder':
				return <FolderCard folder={entity as Folder} {...commonProps} />;
			case 'album':
				return <AlbumCard data={entity as Album} {...commonProps} />;
			case 'tag':
				return <TagsCard tag={entity as Tag} {...commonProps} />;
			case 'collection':
				return <CollectionCard collection={entity as Collection} {...commonProps} />;
			case 'character': {
				// Convertimos stats de string a objeto si es necesario
				const characterWithStats = entity as Character;
				let parsedStats: CharacterStats | undefined;

				if (typeof characterWithStats.stats === 'string') {
					try {
						parsedStats = JSON.parse(characterWithStats.stats);
					} catch (e) {
						console.error('Error al parsear stats del personaje:', e);
						parsedStats = undefined;
					}
				}

				const extendedCharacter: CharacterExtended = {
					...characterWithStats,
					stats: parsedStats,
					presetId: entity.presetId
				};

				return <CharacterCard character={extendedCharacter} {...commonProps} />;
			}
			case 'place':
				return <PlaceCard place={entity as Place} {...commonProps} />;
			case 'world-item':
			case 'worldItem':
				return <WorldItemAdapter worldItem={entity as WorldItem} {...commonProps} />;
			case 'concept': {
				const extendedConcept: ExtendedConcept = {
					...(entity as Concept),
					presetId: entity.presetId || ''
				};
				return <ConceptCard concept={extendedConcept} {...commonProps} />;
			}
			case 'prompt': {
				const promptEntity = entity as Prompt;
				const extendedPrompt: ExtendedPrompt = {
					...promptEntity,
					_count: {
						uses: promptEntity._count?.prompts || 0
					},
					presetId: entity.presetId
				};
				return <PromptCard prompt={extendedPrompt} {...commonProps} />;
			}
			case 'note': {
				const extendedNote: ExtendedNote = {
					...(entity as Note),
					presetId: entity.presetId || ''
				};
				return <NoteCard note={extendedNote} {...commonProps} />;
			}
			default:
				console.warn(`No se ha implementado todavía un layout para el tipo de entidad: ${entityType}`);
				return (
					<div className="error-card p-4 border border-red-500 rounded-md">
						<h3 className="text-red-500 font-medium">Tipo de entidad no soportado</h3>
						<p className="text-sm text-gray-500">No se ha encontrado un layout para: {entityType}</p>
					</div>
				);
		}
	},
	(prevProps, nextProps) => {
		// Función de comparación personalizada para evitar re-renderizados innecesarios
		// Solo re-renderizar si cambian propiedades clave
		return (
			prevProps.entityType === nextProps.entityType &&
			prevProps.entity.id === nextProps.entity.id &&
			prevProps.isExploded === nextProps.isExploded &&
			prevProps.activeLayer === nextProps.activeLayer &&
			JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
		);
	}
);
