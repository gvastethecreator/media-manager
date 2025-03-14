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

// Importamos todos los adaptadores de tarjeta
import { AlbumCard } from '../layouts/album-card';
import { CharacterCard } from '../layouts/character-card';
import { CollectionCard } from '../layouts/collection-card';
import { ConceptCard } from '../layouts/concept-card';
import { FolderCard } from '../layouts/folder-card';
import { NoteCard } from '../layouts/note-card';
import { PlaceCard } from '../layouts/place-card';
import { PromptCard } from '../layouts/prompt-card';
import { TagCard } from '../layouts/tag-card';
import { WorldItemCard } from '../layouts/world-item-card';

import type { CardOptions } from '../types/unified-card-types';

// Tipo de unión para todas las entidades posibles
export type Entity = Folder | Album | Tag | Collection | Character | Place | WorldItem | Concept | Prompt | Note;

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
export function generateRarityConfig(level: string, color: string = '#3b82f6') {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}

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
		options,
	};

	// Renderizamos el adaptador según el tipo de entidad
	switch (entityType) {
		case 'folder':
			return <FolderCard folder={entity as Folder} {...commonProps} />;
		case 'album':
			return <AlbumCard album={entity as Album} {...commonProps} />;
		case 'tag':
			return <TagCard tag={entity as Tag} {...commonProps} />;
		case 'collection':
			return <CollectionCard collection={entity as Collection} {...commonProps} />;
		case 'character':
			return <CharacterCard character={entity as Character} {...commonProps} />;
		case 'place':
			return <PlaceCard place={entity as Place} {...commonProps} />;
		case 'worldItem':
			return <WorldItemCard worldItem={entity as WorldItem} {...commonProps} />;
		case 'concept':
			return <ConceptCard concept={entity as Concept} {...commonProps} />;
		case 'prompt':
			return <PromptCard prompt={entity as Prompt} {...commonProps} />;
		case 'note':
			return <NoteCard note={entity as Note} {...commonProps} />;
		default:
			console.warn(`No se ha implementado todavía un layout para el tipo de entidad: ${entityType}`);
			return (
				<div className="error-card p-4 border border-red-500 rounded-md">
					<h3 className="text-red-500 font-medium">Tipo de entidad no soportado</h3>
					<p className="text-sm text-gray-500">No se ha encontrado un layout para: {entityType}</p>
				</div>
			);
	}
}
