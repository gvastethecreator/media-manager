/**
 * @file Componente despachador de tarjetas de entidad V2 - Usando tipos WithStats
 * @module components/cards/entity-card-v2
 * @description Nueva versión de EntityCard que usa tipos optimizados WithStats
 * en lugar de los tipos legacy AnyEntity.
 *
 * MIGRACIÓN: Este componente reemplazará a entity-card.tsx una vez completada la migración.
 */

import type { FC } from 'react';
import React, { memo } from 'react';
import type { AudioWithStats } from '@/types/entities/audio';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import type { PlaceWithStats } from '@/types/entities/place';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { PropertyWithStats } from '@/types/entities/property';
import type { VideoWithStats } from '@/types/entities/video/types';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import type { AnyEntityWithStats } from '@/types/migration';
import {
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
import { CollectionCard } from './collection-card/collection-card';
import { ConceptCard } from './concept-card/concept-card';
import { DocumentCard } from './document-card/document-card';
import { FolderCard } from './folder-card/folder-card';
import { GroupCard } from './group-card/group-card';
import { useCardLayout } from './hooks/use-card-layout';
import { ImageCard } from './image-card';
import { PlaceCard } from './place-card/place-card';
import { PromptCard } from './prompt-card/prompt-card';
import { PropertyCard } from './property-card/property-card';
import { TagCard } from './tag-card/tag-card';
// Importar el nuevo sistema de layouts
import type { BaseCardProps, CardVariant } from './types/card-layout.types';
import { VideoCard } from './video-card/video-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

// Importar estilos de accesibilidad
import '../features/file-browser/styles/accessibility.css';

export interface EntityCardProps extends BaseCardProps {
	entity: AnyEntityWithStats;
	/** Preset de layout específico para el contexto */
	preset?: string;
}

export const EntityCard: FC<EntityCardProps> = memo(
	({
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
				default:
					return 'default';
			}
		};

		// Crear wrappers para onClick handlers que convierten MouseEvent a datos específicos
		const createVideoClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
			if (!originalOnClick) return undefined;
			return (_videoData: VideoWithStats) => {
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => { },
					stopPropagation: () => { },
					currentTarget: null,
					target: null,
				} as unknown as React.MouseEvent;
				originalOnClick(syntheticEvent);
			};
		};

		const createSimpleClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
			if (!originalOnClick) return undefined;
			return () => {
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => { },
					stopPropagation: () => { },
					currentTarget: null,
					target: null,
				} as unknown as React.MouseEvent;
				originalOnClick(syntheticEvent);
			};
		};

		// Crear wrapper para onClick que convierta el formato de ImageCard al formato de FileBrowser
		const createImageClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
			console.log('🔧 EntityCard - createImageClickHandler llamado con onClick:', !!originalOnClick);
			if (!originalOnClick) return undefined;
			return (imageData?: ImageWithStats) => {
				console.log('🖱️ EntityCard - ImageCard onClick ejecutado para imagen:', imageData?.id || 'no-id');
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => { },
					stopPropagation: () => { },
					currentTarget: null,
					target: null,
					shiftKey: false,
					ctrlKey: false,
					metaKey: false,
				} as unknown as React.MouseEvent;
				originalOnClick(syntheticEvent);
			};
		};

		// Renderizar componente específico basado en type guards
		if (isImageWithStats(entity)) {
			const imageClickHandler = createImageClickHandler(onClick);
			const imageDoubleClickHandler = onDoubleClick ? () => onDoubleClick() : undefined;

			console.log('🔧 EntityCard - Renderizando ImageCard con handlers:', {
				hasClickHandler: !!imageClickHandler,
				hasDoubleClickHandler: !!imageDoubleClickHandler,
			});

			return (
				<ImageCard
					imageId={entity.id}
					onClick={imageClickHandler}
					onDoubleClick={imageDoubleClickHandler}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className || ''}`}
					showTags={config.showTags}
					showDetails={config.showDetails}
					aspectRatio={config.aspectRatio as string}
					variant={mapToImageCardVariant(config.variant)}
					tcgMode={config.variant === 'tcg'}
					showRelations={config.showMetadata}
					data-item-id={entity.id}
					role="button"
					tabIndex={0}
					aria-label={`Imagen: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					aria-describedby={`entity-${entity.id}-description`}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (e.key === 'Enter' && onDoubleClick) {
								onDoubleClick();
							} else if (onClick) {
								const syntheticEvent = {
									preventDefault: () => { },
									stopPropagation: () => { },
									currentTarget: e.currentTarget,
									target: e.target,
									shiftKey: e.shiftKey,
									ctrlKey: e.ctrlKey,
									metaKey: e.metaKey,
								} as unknown as React.MouseEvent;
								onClick(syntheticEvent);
							}
						}
					}}
				/>
			);
		}

		if (isVideoWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
					role="button"
					tabIndex={0}
					aria-label={`Video: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					aria-describedby={`entity-${entity.id}-description`}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (onClick) {
								const syntheticEvent = {
									preventDefault: () => { },
									stopPropagation: () => { },
									currentTarget: e.currentTarget,
									target: e.target,
									shiftKey: e.shiftKey,
									ctrlKey: e.ctrlKey,
									metaKey: e.metaKey,
								} as unknown as React.MouseEvent;
								onClick(syntheticEvent);
							}
						}
					}}
				>
					<VideoCard
						videoId={entity.id}
						onClick={createVideoClickHandler(onClick)}
						className={className}
						compact={config.layout === 'compact' || config.size === 'sm'}
						isSelected={isSelected}
						tcgMode={config.variant === 'tcg'}
					/>
					<div id={`entity-${entity.id}-description`} className="sr-only">
						{`Video ${entity.name || 'sin nombre'}. ${isSelected ? 'Seleccionado.' : ''} Presiona Enter para abrir, Espacio para seleccionar.`}
					</div>
				</div>
			);
		}

		if (isAlbumWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
					role="button"
					tabIndex={0}
					aria-label={`Álbum: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					aria-describedby={`entity-${entity.id}-description`}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (onClick) {
								const syntheticEvent = {
									preventDefault: () => { },
									stopPropagation: () => { },
									currentTarget: e.currentTarget,
									target: e.target,
									shiftKey: e.shiftKey,
									ctrlKey: e.ctrlKey,
									metaKey: e.metaKey,
								} as unknown as React.MouseEvent;
								onClick(syntheticEvent);
							}
						}
					}}
				>
					<AlbumCard
						album={entity as any}
						onClick={createSimpleClickHandler(onClick)}
						className={className}
						compact={config.layout === 'compact' || config.size === 'sm'}
					/>
					<div id={`entity-${entity.id}-description`} className="sr-only">
						{`Álbum ${entity.name || 'sin nombre'}. ${isSelected ? 'Seleccionado.' : ''} Presiona Enter para abrir, Espacio para seleccionar.`}
					</div>
				</div>
			);
		}

		if (isCollectionWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<CollectionCard
						collection={entity}
						onClick={createSimpleClickHandler(onClick)}
						className={className}
						compact={config.layout === 'compact' || config.size === 'sm'}
						showEntitiesCount={config.showStats}
						showImagesCount={config.showStats}
					/>
				</div>
			);
		}

		if (isCharacterWithStats(entity)) {
			// Temporalmente deshabilitado debido a incompatibilidades de tipos
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className}`}
				>
					<p>Character Card - En desarrollo</p>
				</div>
			);
		}

		if (isFolderWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<FolderCard
						folder={entity}
						onClick={createSimpleClickHandler(onClick)}
						className={className}
						interactive={!!onClick}
					/>
				</div>
			);
		}

		if (isAudioWithStats(entity)) {
			const createAudioClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_audioData: AudioWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<AudioCard audio={entity} onClick={createAudioClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isDocumentWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<DocumentCard document={entity as any} onClick={createSimpleClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isTagWithStats(entity)) {
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<TagCard tag={entity} onClick={createSimpleClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isNoteWithStats(entity)) {
			// Temporalmente deshabilitado debido a incompatibilidades de tipos
			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className}`}
				>
					<p>Note Card - En desarrollo</p>
				</div>
			);
		}

		if (isPlaceWithStats(entity)) {
			const createPlaceClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_placeData: PlaceWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<PlaceCard placeId={entity.id} onClick={createPlaceClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isWorldItemWithStats(entity)) {
			const createWorldItemClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_worldItemData: WorldItemWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<WorldItemCard worldItemId={entity.id} onClick={createWorldItemClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isConceptWithStats(entity)) {
			const createConceptClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_concept: ConceptWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<ConceptCard conceptId={entity.id} onClick={createConceptClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isPromptWithStats(entity)) {
			const createPromptClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_promptData: PromptWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<PromptCard promptId={entity.id} onClick={createPromptClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isPropertyWithStats(entity)) {
			const createPropertyClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_propertyData: PropertyWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<PropertyCard propertyId={entity.id} onClick={createPropertyClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isGroupWithStats(entity)) {
			const createGroupClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_group: GroupWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<GroupCard groupId={entity.id} onClick={createGroupClickHandler(onClick)} className={className} />
				</div>
			);
		}

		if (isWildcardWithStats(entity)) {
			const createWildcardClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return undefined;
				return (_wildcard: WildcardWithStats) => {
					const syntheticEvent = {
						preventDefault: () => { },
						stopPropagation: () => { },
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div
					data-item-id={entity.id}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
				>
					<WildcardCard wildcard={entity} onClick={createWildcardClickHandler(onClick)} className={className} />
				</div>
			);
		}

		// Fallback para entidades no reconocidas
		console.warn('EntityCard: Tipo de entidad no reconocido:', getEntityStatsType(entity));
		return null;
	}
);

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
