/**
 * @file Componente despachador de tarjetas de entidad V2 - Usando tipos WithStats
 * @module components/cards/entity-card-v2
 * @description Nueva versión de EntityCard que usa tipos optimizados WithStats
 * en lugar de los tipos legacy AnyEntity.
 *
 * MIGRACIÓN: Este componente reemplazará a entity-card.tsx una vez completada la migración.
 */

import type { FC } from 'react';
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

// Importar componentes de tarjetas
import { AlbumCard } from './album-card/album-card';
import { AudioCard } from './audio-card/audio-card';
import { CharacterCard } from './character-card/character-card';
import { CollectionCard } from './collection-card/collection-card';
import { ConceptCard } from './concept-card/concept-card';
import { DocumentCard } from './document-card/document-card';
import { FolderCard } from './folder-card/folder-card';
import { GroupCard } from './group-card/group-card';
import { useCardLayout } from './hooks/use-card-layout';
import { ImageCard } from './image-card';
import { NoteCard } from './note-card/note-card';
import { PlaceCard } from './place-card/place-card';
import { PromptCard } from './prompt-card/prompt-card';
import { PropertyCard } from './property-card/property-card';
import { TagCard } from './tag-card/tag-card';
// Importar el nuevo sistema de layouts
import type { BaseCardProps } from './types/card-layout.types';
import { VideoCard } from './video-card/video-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

interface EntityCardProps extends BaseCardProps {
	entity: EntityWithStats;
	/** Preset de layout específico para el contexto */
	preset?: string;
}

export const EntityCard: FC<EntityCardProps> = ({
	entity,
	onClick,
	onDoubleClick,
	isSelected,
	isActive,
	className,
	// Props del nuevo sistema de layouts
	layoutConfig,
	layout,
	size,
	variant,
	preset,
	// Props legacy para compatibilidad
	compact,
	tcgMode,
	...props
}) => {
	// Usar el hook de layout para obtener la configuración
	const { config } = useCardLayout(
		{
			layoutConfig,
			layout,
			size,
			variant,
			className,
			isSelected,
			isActive,
			onClick,
			onDoubleClick,
			compact,
			tcgMode,
		},
		preset
	);

	// Props comunes para todas las cards
	const commonProps = {
		onClick,
		onDoubleClick,
		isSelected,
		isActive,
		className,
		// Pasar las nuevas props de layout
		layoutConfig: config,
		layout: config.layout,
		size: config.size,
		variant: config.variant,
		// Mantener compatibilidad con props legacy
		compact: config.layout === 'compact' || config.size === 'sm',
		tcgMode: config.variant === 'tcg',
		// Props adicionales del layout
		showTags: config.showTags,
		showDetails: config.showDetails,
		showStats: config.showStats,
		showMetadata: config.showMetadata,
		showActions: config.showActions,
		...props,
	};

	// Renderizar componente específico basado en type guards
	if (isImageWithStats(entity)) {
		return (
			<ImageCard
				image={entity}
				{...commonProps}
				// Props específicas de ImageCard
				aspectRatio={config.aspectRatio as string}
			/>
		);
	}

	if (isVideoWithStats(entity)) {
		return <VideoCard video={entity} {...commonProps} />;
	}

	if (isAlbumWithStats(entity)) {
		return <AlbumCard album={entity} {...commonProps} />;
	}

	if (isCollectionWithStats(entity)) {
		return <CollectionCard collection={entity} {...commonProps} />;
	}

	if (isCharacterWithStats(entity)) {
		return <CharacterCard character={entity} {...commonProps} />;
	}

	if (isFolderWithStats(entity)) {
		return (
			<FolderCard
				folder={entity}
				{...commonProps}
				// Props específicas de FolderCard
				interactive={!!onClick}
			/>
		);
	}

	if (isAudioWithStats(entity)) {
		return <AudioCard audio={entity} {...commonProps} />;
	}

	if (isDocumentWithStats(entity)) {
		return <DocumentCard document={entity} {...commonProps} />;
	}

	if (isTagWithStats(entity)) {
		return <TagCard tag={entity} {...commonProps} />;
	}

	if (isNoteWithStats(entity)) {
		return <NoteCard note={entity} {...commonProps} />;
	}

	if (isPlaceWithStats(entity)) {
		return <PlaceCard place={entity} {...commonProps} />;
	}

	if (isWorldItemWithStats(entity)) {
		return <WorldItemCard worldItem={entity} {...commonProps} />;
	}

	if (isConceptWithStats(entity)) {
		return <ConceptCard concept={entity} {...commonProps} />;
	}

	if (isPromptWithStats(entity)) {
		return <PromptCard prompt={entity} {...commonProps} />;
	}

	if (isPropertyWithStats(entity)) {
		return <PropertyCard property={entity} {...commonProps} />;
	}

	if (isGroupWithStats(entity)) {
		return <GroupCard group={entity} {...commonProps} />;
	}

	if (isWildcardWithStats(entity)) {
		return <WildcardCard wildcard={entity} {...commonProps} />;
	}

	// Fallback para entidades no reconocidas
	console.warn('EntityCard: Tipo de entidad no reconocido:', getEntityStatsType(entity));
	return null;
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
