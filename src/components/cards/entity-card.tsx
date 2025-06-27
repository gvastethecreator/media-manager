/**
 * @file Componente despachador de tarjetas de entidad V2 - Usando tipos WithStats
 * @module components/cards/entity-card-v2
 * @description Nueva versión de EntityCard que usa tipos optimizados WithStats
 * en lugar de los tipos legacy AnyEntity.
 *
 * MIGRACIÓN: Este componente reemplazará a entity-card.tsx una vez completada la migración.
 */
'use client';

import {
	type EntityWithStats,
	getEntityStatsType,
	isAlbumWithStats,
	isAudioWithStats,
	isCharacterWithStats,
	isCollectionWithStats,
	isConceptWithStats,
	isDocumentWithStats,
	isFolderWithStats,
	isGroupWithStats,
	isImageWithStats,
	isNoteWithStats,
	isPlaceWithStats,
	isPromptWithStats,
	isPropertyWithStats,
	isTagWithStats,
	isVideoWithStats,
	isWildcardWithStats,
	isWorldItemWithStats,
} from '@/types/migration';
import type { FC } from 'react';

// Importar componentes de tarjetas
import { AlbumCard } from './album-card/album-card';
import { AudioCard } from './audio-card/audio-card';
import { CharacterCard } from './character-card/character-card';
import { CollectionCard } from './collection-card/collection-card';
import { ConceptCard } from './concept-card/concept-card';
import { DocumentCard } from './document-card/document-card';
import { FolderCard } from './folder-card/folder-card';
import { GroupCard } from './group-card/group-card';
import { ImageCard } from './image-card/image-card-improved';
import { NoteCard } from './note-card/note-card';
import { PlaceCard } from './place-card/place-card';
import { PromptCard } from './prompt-card/prompt-card';
import { PropertyCard } from './property-card/property-card';
import { TagCard } from './tag-card/tag-card';
import { VideoCard } from './video-card/video-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

interface EntityCardProps {
	entity: EntityWithStats;
	onClick?: () => void;
	onDoubleClick?: () => void;
	isSelected?: boolean;
	isActive?: boolean;
	className?: string;
	compact?: boolean;
	tcgMode?: boolean;
}

export const EntityCard: FC<EntityCardProps> = ({
	entity,
	onClick,
	onDoubleClick,
	isSelected,
	isActive,
	className,
	compact,
	tcgMode = true,
	...props
}) => {
	// Renderizar componente específico basado en type guards
	if (isImageWithStats(entity)) {
		return (
			<ImageCard
				image={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isVideoWithStats(entity)) {
		return (
			<VideoCard
				video={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isAlbumWithStats(entity)) {
		return (
			<AlbumCard
				album={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isCollectionWithStats(entity)) {
		return (
			<CollectionCard
				collection={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isCharacterWithStats(entity)) {
		return (
			<CharacterCard
				character={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isFolderWithStats(entity)) {
		return (
			<FolderCard
				folder={entity}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				{...props}
			/>
		);
	}

	if (isAudioWithStats(entity)) {
		return (
			<AudioCard
				audio={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isDocumentWithStats(entity)) {
		return (
			<DocumentCard
				document={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isTagWithStats(entity)) {
		return (
			<TagCard
				tag={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				{...props}
			/>
		);
	}

	if (isNoteWithStats(entity)) {
		return (
			<NoteCard
				note={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isPlaceWithStats(entity)) {
		return (
			<PlaceCard
				place={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isWorldItemWithStats(entity)) {
		return (
			<WorldItemCard
				worldItem={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isPromptWithStats(entity)) {
		return (
			<PromptCard
				prompt={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isConceptWithStats(entity)) {
		return (
			<ConceptCard
				concept={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	if (isWildcardWithStats(entity)) {
		return (
			<WildcardCard
				wildcard={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				{...props}
			/>
		);
	}

	if (isPropertyWithStats(entity)) {
		return (
			<PropertyCard
				property={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				{...props}
			/>
		);
	}

	if (isGroupWithStats(entity)) {
		return (
			<GroupCard
				group={entity}
				onClick={onClick}
				isSelected={isSelected}
				isActive={isActive}
				className={className}
				compact={compact}
				tcgMode={tcgMode}
				{...props}
			/>
		);
	}

	// Fallback para tipos no reconocidos
	const entityType = getEntityStatsType(entity);
	console.warn(`No card component found for entity type: ${entityType}`, entity);

	return (
		<div className="border rounded-lg p-4 bg-destructive/10 text-destructive-foreground">
			<p>Unsupported entity type: {entityType}</p>
			<pre className="text-xs mt-2 overflow-hidden text-ellipsis">
				{JSON.stringify(entity, null, 2).slice(0, 200)}...
			</pre>
		</div>
	);
};

/**
 * 📝 Documentación de migración:
 *
 * Este componente reemplaza a entity-card.tsx con las siguientes mejoras:
 * 1. Usa tipos WithStats optimizados en lugar de tipos Complete
 * 2. Type guards robustos para cada tipo de entidad
 * 3. Props consistentes para todas las tarjetas
 * 4. Sin discriminadores manuales (entityType)
 *
 * Para migrar:
 * 1. Importar EntityCardV2 en lugar de EntityCard
 * 2. Pasar EntityWithStats en lugar de AnyEntity
 * 3. Actualizar props según la interfaz EntityCardV2Props
 */
