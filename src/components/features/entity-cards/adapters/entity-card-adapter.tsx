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
import { AlbumCardLayout } from '../modules/layouts/album-card-layout';
import { CharacterCardLayout } from '../modules/layouts/character-card-layout';
import { CollectionCardLayout } from '../modules/layouts/collection-card-layout';
import { ConceptCardLayout } from '../modules/layouts/concept-card-layout';
import { FolderCardLayout } from '../modules/layouts/folder-card-layout';
import { NoteCardLayout } from '../modules/layouts/note-card-layout';
import { PlaceCardLayout } from '../modules/layouts/place-card-layout';
import { PromptCardLayout } from '../modules/layouts/prompt-card-layout';
import { TagCardLayout } from '../modules/layouts/tag-card-layout';
import { WorldItemCardLayout } from '../modules/layouts/world-item-card-layout';
import type { CardOptions } from '../types/card-settings-types';

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
				<FolderCardLayout
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
				<AlbumCardLayout
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
				<TagCardLayout
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
				<CollectionCardLayout
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
				<CharacterCardLayout
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
				<PlaceCardLayout
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
				<WorldItemCardLayout
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
				<ConceptCardLayout
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
				<PromptCardLayout
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
				<NoteCardLayout
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
