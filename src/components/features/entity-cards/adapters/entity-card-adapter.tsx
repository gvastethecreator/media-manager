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
import { AlbumCard } from '../layouts/album-card-layout';
import { CharacterCard } from '../layouts/character-card-layout';
import { CollectionCard } from '../layouts/collection-card-layout';
import { ConceptCard } from '../layouts/concept-card-layout';
import { FolderCard } from '../layouts/folder-card-layout';
import { NoteCard } from '../layouts/note-card-layout';
import { PlaceCard } from '../layouts/place-card-layout';
import { PromptCard } from '../layouts/prompt-card-layout';
import { TagCard } from '../layouts/tag-card-layout';
import { WorldItemCard } from '../layouts/world-item-card-layout';
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
	// Renderizar el layout específico según el tipo de entidad
	switch (entityType) {
		case 'folder':
			return (
				<FolderCard
					folder={entity as Folder}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'album':
			return (
				<AlbumCard
					album={entity as Album}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'tag':
			return (
				<TagCard
					tag={entity as Tag}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'collection':
			return (
				<CollectionCard
					collection={entity as Collection}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'character':
			return (
				<CharacterCard
					character={entity as Character}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'place':
			return (
				<PlaceCard
					place={entity as Place}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'worldItem':
			return (
				<WorldItemCard
					worldItem={entity as WorldItem}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'concept':
			return (
				<ConceptCard
					concept={entity as Concept}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'prompt':
			return (
				<PromptCard
					prompt={entity as Prompt}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		case 'note':
			return (
				<NoteCard
					note={entity as Note}
					options={options}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
					enableExplode={enableExplode}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={onExplodedChange}
					onActiveLayerChange={onActiveLayerChange}
					className={className}
				/>
			);
		default:
			console.warn(`No se encontró un layout para el tipo de entidad: ${entityType}`);
			return null;
	}
}
