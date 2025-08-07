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
		console.log('🔧 EntityCard - Recibido onClick:', !!onClick, 'para entity:', entity.id);

		// Extraer handlers *ById de props si existen
		const { onClickById, onDoubleClickById, itemId, ...restProps } = props as any;

		// Convertir handlers *ById en handlers normales si no hay handlers directos
		const finalOnClick =
			onClick || (onClickById && itemId ? (e: React.MouseEvent) => onClickById(itemId, e) : undefined);
		const finalOnDoubleClick =
			onDoubleClick || (onDoubleClickById && itemId ? () => onDoubleClickById(itemId) : undefined);

		console.log('🔧 EntityCard - Handlers finales:', {
			hasDirectOnClick: !!onClick,
			hasOnClickById: !!onClickById,
			hasItemId: !!itemId,
			finalHasOnClick: !!finalOnClick,
			finalHasOnDoubleClick: !!finalOnDoubleClick,
		});

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
				onClick: finalOnClick,
				onDoubleClick: finalOnDoubleClick,
				compact,
				tcgMode,
			},
			preset
		);

		// Props comunes para todas las cards
		const commonProps = {
			onClick: finalOnClick,
			onDoubleClick: finalOnDoubleClick,
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
			...restProps,
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
			if (!originalOnClick) return;
			return (_videoData: VideoWithStats) => {
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => {},
					stopPropagation: () => {},
					currentTarget: null,
					target: null,
				} as unknown as React.MouseEvent;
				originalOnClick(syntheticEvent);
			};
		};

		const createSimpleClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
			if (!originalOnClick) return;
			return () => {
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => {},
					stopPropagation: () => {},
					currentTarget: null,
					target: null,
				} as unknown as React.MouseEvent;
				originalOnClick(syntheticEvent);
			};
		};

		// Crear wrapper para onClick que convierta el formato de ImageCard al formato de FileBrowser
		const createImageClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
			console.log('🔧 EntityCard - createImageClickHandler llamado con onClick:', !!originalOnClick);
			if (!originalOnClick) return;
			return (imageData?: ImageWithStats) => {
				console.log('🖱️ EntityCard - ImageCard onClick ejecutado para imagen:', imageData?.id || 'no-id');
				// Crear un evento sintético para mantener compatibilidad
				const syntheticEvent = {
					preventDefault: () => {},
					stopPropagation: () => {},
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
			const imageClickHandler = createImageClickHandler(finalOnClick);
			const imageDoubleClickHandler = finalOnDoubleClick ? () => finalOnDoubleClick() : undefined;

			console.log('🔧 EntityCard - Renderizando ImageCard con handlers:', {
				hasClickHandler: !!imageClickHandler,
				hasDoubleClickHandler: !!imageDoubleClickHandler,
			});

			return (
				<ImageCard
					aria-describedby={`entity-${entity.id}-description`}
					aria-label={`Imagen: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					aspectRatio={config.aspectRatio as string}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className || ''}`}
					data-item-id={entity.id}
					imageId={entity.id}
					onClick={imageClickHandler}
					onDoubleClick={imageDoubleClickHandler}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (e.key === 'Enter' && onDoubleClick) {
								onDoubleClick();
							} else if (onClick) {
								const syntheticEvent = {
									preventDefault: () => {},
									stopPropagation: () => {},
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
					role="button"
					showDetails={config.showDetails}
					showRelations={config.showMetadata}
					showTags={config.showTags}
					tabIndex={0}
					tcgMode={config.variant === 'tcg'}
					variant={mapToImageCardVariant(config.variant)}
				/>
			);
		}

		if (isVideoWithStats(entity)) {
			return (
				<div
					aria-describedby={`entity-${entity.id}-description`}
					aria-label={`Video: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
					data-item-id={entity.id}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (onClick) {
								const syntheticEvent = {
									preventDefault: () => {},
									stopPropagation: () => {},
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
					role="button"
					tabIndex={0}
				>
					<VideoCard
						className={className}
						compact={config.layout === 'compact' || config.size === 'sm'}
						isSelected={isSelected}
						onClick={createVideoClickHandler(onClick)}
						tcgMode={config.variant === 'tcg'}
						videoId={entity.id}
					/>
					<div className="sr-only" id={`entity-${entity.id}-description`}>
						{`Video ${entity.name || 'sin nombre'}. ${isSelected ? 'Seleccionado.' : ''} Presiona Enter para abrir, Espacio para seleccionar.`}
					</div>
				</div>
			);
		}

		if (isAlbumWithStats(entity)) {
			return (
				<div
					aria-describedby={`entity-${entity.id}-description`}
					aria-label={`Álbum: ${entity.name || 'Sin nombre'}`}
					aria-selected={isSelected}
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
					data-item-id={entity.id}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (onClick) {
								const syntheticEvent = {
									preventDefault: () => {},
									stopPropagation: () => {},
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
					role="button"
					tabIndex={0}
				>
					<AlbumCard
						album={entity as any}
						className={className}
						compact={config.layout === 'compact' || config.size === 'sm'}
						onClick={createSimpleClickHandler(onClick)}
					/>
					<div className="sr-only" id={`entity-${entity.id}-description`}>
						{`Álbum ${entity.name || 'sin nombre'}. ${isSelected ? 'Seleccionado.' : ''} Presiona Enter para abrir, Espacio para seleccionar.`}
					</div>
				</div>
			);
		}

		if (isCollectionWithStats(entity)) {
			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<CollectionCard
						className={className}
						collection={entity}
						compact={config.layout === 'compact' || config.size === 'sm'}
						onClick={createSimpleClickHandler(onClick)}
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
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className}`}
					data-item-id={entity.id}
				>
					<p>Character Card - En desarrollo</p>
				</div>
			);
		}

		if (isFolderWithStats(entity)) {
			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<FolderCard
						className={className}
						folder={entity}
						interactive={!!onClick}
						onClick={createSimpleClickHandler(onClick)}
					/>
				</div>
			);
		}

		if (isAudioWithStats(entity)) {
			const createAudioClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_audioData: AudioWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<AudioCard audio={entity} className={className} onClick={createAudioClickHandler(onClick)} />
				</div>
			);
		}

		if (isDocumentWithStats(entity)) {
			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<DocumentCard className={className} document={entity as any} onClick={createSimpleClickHandler(onClick)} />
				</div>
			);
		}

		if (isTagWithStats(entity)) {
			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<TagCard className={className} onClick={createSimpleClickHandler(onClick)} tag={entity} />
				</div>
			);
		}

		if (isNoteWithStats(entity)) {
			// Temporalmente deshabilitado debido a incompatibilidades de tipos
			return (
				<div
					className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className}`}
					data-item-id={entity.id}
				>
					<p>Note Card - En desarrollo</p>
				</div>
			);
		}

		if (isPlaceWithStats(entity)) {
			const createPlaceClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_placeData: PlaceWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<PlaceCard className={className} onClick={createPlaceClickHandler(onClick)} placeId={entity.id} />
				</div>
			);
		}

		if (isWorldItemWithStats(entity)) {
			const createWorldItemClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_worldItemData: WorldItemWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<WorldItemCard className={className} onClick={createWorldItemClickHandler(onClick)} worldItemId={entity.id} />
				</div>
			);
		}

		if (isConceptWithStats(entity)) {
			const createConceptClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_concept: ConceptWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<ConceptCard className={className} conceptId={entity.id} onClick={createConceptClickHandler(onClick)} />
				</div>
			);
		}

		if (isPromptWithStats(entity)) {
			const createPromptClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_promptData: PromptWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<PromptCard className={className} onClick={createPromptClickHandler(onClick)} promptId={entity.id} />
				</div>
			);
		}

		if (isPropertyWithStats(entity)) {
			const createPropertyClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_propertyData: PropertyWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<PropertyCard className={className} onClick={createPropertyClickHandler(onClick)} propertyId={entity.id} />
				</div>
			);
		}

		if (isGroupWithStats(entity)) {
			const createGroupClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_group: GroupWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<GroupCard className={className} groupId={entity.id} onClick={createGroupClickHandler(onClick)} />
				</div>
			);
		}

		if (isWildcardWithStats(entity)) {
			const createWildcardClickHandler = (originalOnClick?: (e: React.MouseEvent) => void) => {
				if (!originalOnClick) return;
				return (_wildcard: WildcardWithStats) => {
					const syntheticEvent = {
						preventDefault: () => {},
						stopPropagation: () => {},
						currentTarget: null,
						target: null,
					} as unknown as React.MouseEvent;
					originalOnClick(syntheticEvent);
				};
			};

			return (
				<div className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`} data-item-id={entity.id}>
					<WildcardCard className={className} onClick={createWildcardClickHandler(onClick)} wildcard={entity} />
				</div>
			);
		}

		// Fallback para entidades no reconocidas
		console.warn('EntityCard: Tipo de entidad no reconocido:', getEntityStatsType(entity as any));
		return (
			<div
				className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className}`}
				data-item-id={(entity as any).id}
			>
				<p>Tipo de entidad no soportado</p>
			</div>
		);
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

// Export alias for backward compatibility
export const OptimizedEntityCard = EntityCard;
