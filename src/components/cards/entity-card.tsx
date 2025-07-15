/**
 * @file Componente despachador de tarjetas de entidad V2 - Usando tipos WithStats
 * @module components/cards/entity-card-v2
 * @description Nueva versión de EntityCard que usa tipos optimizados WithStats
 * en lugar de los tipos legacy AnyEntity.
 *
 * MIGRACIÓN: Este componente reemplazará a entity-card.tsx una vez completada la migración.
 */

import type { FC } from 'react';
import type { AnyEntityWithStats } from '@/types/migration';
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
import { adaptCharacterWithStats } from './character-card/character-card-adapter';
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
import type { BaseCardProps, CardVariant } from './types/card-layout.types';
import { VideoCard } from './video-card/video-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

interface EntityCardProps extends BaseCardProps {
	entity: AnyEntityWithStats;
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

	// Función para mapear CardVariant a variantes específicas de ImageCard
	const mapToImageCardVariant = (variant: CardVariant): 'default' | 'minimal' | 'polaroid' | 'tcg' => {
		switch (variant) {
			case 'minimal':
				return 'minimal';
			case 'polaroid':
				return 'polaroid';
			case 'tcg':
				return 'tcg';
			case 'elevated':
			case 'outlined':
			case 'glass':
			case 'default':
			default:
				return 'default';
		}
	};

	// Renderizar componente específico basado en type guards
	if (isImageWithStats(entity)) {
		return (
			<ImageCard
				imageId={entity.id}
				onClick={onClick}
				className={className}
				showTags={config.showTags}
				showDetails={config.showDetails}
				aspectRatio={config.aspectRatio as string}
				variant={mapToImageCardVariant(config.variant)}
				tcgMode={config.variant === 'tcg'}
				showRelations={config.showMetadata}
			/>
		);
	}

	if (isVideoWithStats(entity)) {
		return (
			<VideoCard
				videoId={entity.id}
				onClick={onClick}
				className={className}
				compact={config.layout === 'compact' || config.size === 'sm'}
				isSelected={isSelected}
				tcgMode={config.variant === 'tcg'}
			/>
		);
	}

	if (isAlbumWithStats(entity)) {
		// @ts-expect-error - TODO: Fix AlbumCard props
		return <AlbumCard album={entity} {...commonProps} />;
	}

	if (isCollectionWithStats(entity)) {
		return (
			<CollectionCard
				collection={entity}
				onClick={onClick}
				className={className}
				compact={config.layout === 'compact' || config.size === 'sm'}
				showEntitiesCount={config.showStats}
				showImagesCount={config.showStats}
			/>
		);
	}

	if (isCharacterWithStats(entity)) {
		return (
			<CharacterCard
				characterId={entity.id}
				character={adaptCharacterWithStats(entity)}
				onClick={onClick}
				className={className}
				tcgMode={config.variant === 'tcg'}
				compact={config.layout === 'compact' || config.size === 'sm'}
				isSelected={isSelected}
			/>
		);
	}

	if (isFolderWithStats(entity)) {
		return <FolderCard folder={entity} onClick={onClick} className={className} interactive={!!onClick} />;
	}

	if (isAudioWithStats(entity)) {
		return <AudioCard audio={entity} onClick={onClick} className={className} />;
	}

	if (isDocumentWithStats(entity)) {
		return <DocumentCard document={entity} onClick={onClick} className={className} />;
	}

	if (isTagWithStats(entity)) {
		return <TagCard tag={entity} onClick={onClick} className={className} />;
	}

	if (isNoteWithStats(entity)) {
		return <NoteCard noteId={entity.id} onClick={onClick} className={className} />;
	}

	if (isPlaceWithStats(entity)) {
		return <PlaceCard placeId={entity.id} onClick={onClick} className={className} />;
	}

	if (isWorldItemWithStats(entity)) {
		return <WorldItemCard worldItemId={entity.id} onClick={onClick} className={className} />;
	}

	if (isConceptWithStats(entity)) {
		return <ConceptCard conceptId={entity.id} onClick={onClick} className={className} />;
	}

	if (isPromptWithStats(entity)) {
		return <PromptCard promptId={entity.id} onClick={onClick} className={className} />;
	}

	if (isPropertyWithStats(entity)) {
		return <PropertyCard propertyId={entity.id} onClick={onClick} className={className} />;
	}

	if (isGroupWithStats(entity)) {
		// @ts-expect-error - TODO: Fix GroupCard props
		return <GroupCard group={entity} onClick={onClick} className={className} />;
	}

	if (isWildcardWithStats(entity)) {
		return <WildcardCard wildcard={entity} onClick={onClick} className={className} />;
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
