'use client';

// Definir un tipo genérico para entidades si no existe en @/types/entities
interface Entity {
	id: string;
	name: string;
	description?: string;
	[key: string]: any;
}

import { useEffect, useState } from 'react';
import { createCardAdapter } from './adapters/card-adapter-factory';
import { AlbumCard } from './layouts/album-card';
import { CharacterCard } from './layouts/character-card';
import { CollectionCard } from './layouts/collection-card';
import { ConceptCard } from './layouts/concept-card';
import { FolderCard } from './layouts/folder-card';
import { NoteCard } from './layouts/note-card';
import { PlaceCard } from './layouts/place-card';
import { PromptCard } from './layouts/prompt-card';
import { TagCard } from './layouts/tag-card';
import { WorldItemCard } from './layouts/world-item-card';
import type { CardOptions } from './types';

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

// Crear un adaptador para cada tipo de entidad
const folderAdapter = createCardAdapter(FolderCard, 'folder');
const albumAdapter = createCardAdapter(AlbumCard, 'album');
const tagAdapter = createCardAdapter(TagCard, 'tag');
const collectionAdapter = createCardAdapter(CollectionCard, 'collection');
const characterAdapter = createCardAdapter(CharacterCard, 'character');
const placeAdapter = createCardAdapter(PlaceCard, 'place');
const worldItemAdapter = createCardAdapter(WorldItemCard, 'worldItem');
const conceptAdapter = createCardAdapter(ConceptCard, 'concept');
const promptAdapter = createCardAdapter(PromptCard, 'prompt');
const noteAdapter = createCardAdapter(NoteCard, 'note');

// Mapa de tipos de entidad a adaptadores
const ENTITY_ADAPTERS: Record<string, any> = {
	folder: folderAdapter,
	album: albumAdapter,
	tag: tagAdapter,
	collection: collectionAdapter,
	character: characterAdapter,
	place: placeAdapter,
	worldItem: worldItemAdapter,
	concept: conceptAdapter,
	prompt: promptAdapter,
	note: noteAdapter,
};

/**
 * Adaptador genérico para cualquier tipo de entidad
 * Selecciona el layout apropiado según el tipo de entidad
 */
export function EntityCardAdapter({
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
	// Estado para manejar la carga de datos adicionales si es necesario
	const [enhancedEntity, setEnhancedEntity] = useState<Entity>(entity);

	// Efecto para cargar datos adicionales según el tipo de entidad
	useEffect(() => {
		// Función para cargar datos adicionales de carpetas
		const loadFolderData = async (folderId: string) => {
			try {
				// Solo cargar datos adicionales si no están ya presentes
				if (!entity.totalFiles && !entity.totalSize) {
					const response = await fetch(`/api/folders/${folderId}/stats`);
					if (response.ok) {
						const stats = await response.json();
						setEnhancedEntity({
							...entity,
							totalFiles: stats.totalFiles || 0,
							totalSize: stats.totalSize || 0,
							imageCount: stats.imageCount || 0,
							lastIndexed: stats.lastIndexed || null,
						});
					}
				}
			} catch (error) {
				console.error('Error al cargar estadísticas de carpeta:', error);
			}
		};

		// Cargar datos adicionales según el tipo de entidad
		if (entityType === 'folder' && entity.id) {
			loadFolderData(entity.id);
		}

		// Para otros tipos de entidad, podríamos añadir más lógica aquí
	}, [entityType, entity]);

	// Propiedades comunes para todos los tipos de tarjetas
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
		options,
	};

	// Obtener el adaptador correspondiente al tipo de entidad
	const CardAdapter = ENTITY_ADAPTERS[entityType];

	if (CardAdapter) {
		// Crear un objeto con la propiedad específica para este tipo de entidad
		const entityProp = { [entityType]: { ...enhancedEntity, presetId: enhancedEntity.presetId || null } };
		// Combinar las propiedades comunes con la propiedad específica de la entidad
		return <CardAdapter {...commonProps} {...entityProp} />;
	}

	// Mensaje de error si no hay adaptador para este tipo
	console.warn(`No se ha implementado todavía un layout para el tipo de entidad: ${entityType}`);
	return (
		<div className="error-card p-4 border border-red-500 rounded-md">
			<h3 className="text-red-500 font-medium">Tipo de entidad no soportado</h3>
			<p className="text-sm text-gray-500">No se ha encontrado un layout para: {entityType}</p>
		</div>
	);
}

// Función auxiliar para generar configuración de rareza
export function generateRarityConfig(level: string, color: string = '#3b82f6') {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}
