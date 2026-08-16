/**
 * @file Componente despachador de tarjetas de entidad V2 - Usando tipos WithStats
 * @module components/cards/entity-card-v2
 */

import type { FC } from 'react';
import React, { memo } from 'react';
import type { AnyEntityWithStats } from '@/types/entities';
import { getEntityStatsType } from '@/types/entity-guards';
// Importar componentes de tarjetas
import { AlbumCard } from './album-card/album-card';
import { AudioCard } from './audio-card/audio-card';
import { CollectionCard } from './collection-card/collection-card';
import { ConceptCard } from './concept-card/concept-card';
import { DocumentCard } from './document-card/document-card';
import { FolderCard } from './folder-card/folder-card';
import { GroupCard } from './group-card/group-card';
import { useCardLayout } from './hooks/use-card-layout';
import { ImageCard } from './image-card/image-card';
import { PlaceCard } from './place-card/place-card';
import { PromptCard } from './prompt-card/prompt-card';
import { PropertyCard } from './property-card/property-card';
import { TagCard } from './tag-card/tag-card';
import { TCGEntityCard } from './tcg-entity-card';
// Importar el nuevo sistema de layouts
import type { BaseCardProps, CardVariant } from './types/card-layout.types';
import { UploadedImageCard } from './uploaded-image-card/uploaded-image-card';
import { VideoCard } from './video-card/video-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

// Importar estilos de accesibilidad
import '../features/file-browser-new/styles/accessibility.css';

// Utilidad de no-op para evitar cuerpos vacíos en funciones
const noop = () => {
	// no operation
};

// Helpers a nivel de módulo para reducir complejidad en el componente
const mapToImageCardVariant = (cardVariant: CardVariant): 'default' | 'minimal' | 'polaroid' | 'tcg' => {
	switch (cardVariant) {
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

// Eliminado synthetic wrapper: ahora se pasa el handler real directamente para reducir overhead
// (se mantiene noop por compatibilidad potencial)

// Contexto para renderers
interface RenderCtx {
	className?: string;
	config: ReturnType<typeof useCardLayout>['config'];
	entity: AnyEntityWithStats;
	finalOnClick?: (e: React.MouseEvent) => void;
	finalOnDoubleClick?: () => void;
	isSelected?: boolean;
	thumbnailQuality?: 'low' | 'medium' | 'high';
}

// Renderers por tipo
const renderImage = ({
	entity,
	isSelected,
	className,
	config,
	finalOnClick,
	finalOnDoubleClick,
	thumbnailQuality,
}: RenderCtx) => {
	return (
		<ImageCard
			aria-describedby={`entity-${(entity as any).id}-description`}
			aria-label={`Image: ${(entity as any).name || 'Unnamed'}`}
			aspectRatio={config.aspectRatio as string}
			className={`entity-card ${isSelected ? 'entity-card--selected' : ''} ${className || ''}`}
			data-item-id={(entity as any).id}
			imageId={(entity as any).id}
			onClick={finalOnClick as any}
			onDoubleClick={finalOnDoubleClick}
			onKeyDown={(e: React.KeyboardEvent) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					if (e.key === 'Enter' && finalOnDoubleClick) {
						finalOnDoubleClick();
					} else if (finalOnClick) {
						const syntheticEvent = {
							preventDefault: noop,
							stopPropagation: noop,
							currentTarget: e.currentTarget,
							target: e.target,
							shiftKey: e.shiftKey,
							ctrlKey: e.ctrlKey,
							metaKey: e.metaKey,
						} as unknown as React.MouseEvent;
						finalOnClick(syntheticEvent);
					}
				}
			}}
			showRelations={config.showMetadata}
			showTags={config.showTags}
			tabIndex={0}
			tcgMode={config.variant === 'tcg'}
			thumbnailQuality={thumbnailQuality}
			variant={mapToImageCardVariant(config.variant)}
		/>
	);
};

const renderVideo = ({ entity, isSelected, className, config, finalOnClick }: RenderCtx) => (
	<button
		aria-describedby={`entity-${(entity as any).id}-description`}
		aria-label={`Video: ${(entity as any).name || 'Unnamed'}`}
		aria-pressed={isSelected}
		className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
		data-item-id={(entity as any).id}
		onKeyDown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (finalOnClick) {
					const syntheticEvent = {
						// no-op handlers necesarios para cumplir contratos de MouseEvent
						preventDefault: noop,
						stopPropagation: noop,
						currentTarget: e.currentTarget,
						target: e.target,
						shiftKey: e.shiftKey,
						ctrlKey: e.ctrlKey,
						metaKey: e.metaKey,
					} as unknown as React.MouseEvent;
					finalOnClick(syntheticEvent);
				}
			}
		}}
		type="button"
	>
		<VideoCard
			className={className}
			compact={config.layout === 'compact' || config.size === 'sm'}
			isSelected={isSelected}
			onClick={finalOnClick ? () => (finalOnClick as any)({} as any) : undefined}
			tcgMode={config.variant === 'tcg'}
			video={entity as any}
		/>
		<div className="sr-only" id={`entity-${(entity as any).id}-description`}>
			{`Video ${(entity as any).name || 'unnamed'}. ${isSelected ? 'Selected.' : ''} Press Enter to open or Space to select.`}
		</div>
	</button>
);

const renderAlbum = ({ entity, isSelected, className, config, finalOnClick }: RenderCtx) => (
	<button
		aria-describedby={`entity-${(entity as any).id}-description`}
		aria-label={`Album: ${(entity as any).name || 'Unnamed'}`}
		aria-pressed={isSelected}
		className={`entity-card ${isSelected ? 'entity-card--selected' : ''}`}
		data-item-id={(entity as any).id}
		onKeyDown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (finalOnClick) {
					const syntheticEvent = {
						// no-op handlers necesarios para cumplir contratos de MouseEvent
						preventDefault: noop,
						stopPropagation: noop,
						currentTarget: e.currentTarget,
						target: e.target,
						shiftKey: e.shiftKey,
						ctrlKey: e.ctrlKey,
						metaKey: e.metaKey,
					} as unknown as React.MouseEvent;
					finalOnClick(syntheticEvent);
				}
			}
		}}
		type="button"
	>
		<AlbumCard
			album={entity as any}
			className={className}
			compact={config.layout === 'compact' || config.size === 'sm'}
			onClick={finalOnClick ? () => (finalOnClick as any)({} as any) : undefined}
		/>
		<div className="sr-only" id={`entity-${(entity as any).id}-description`}>
			{`Album ${(entity as any).name || 'unnamed'}. ${isSelected ? 'Selected.' : ''} Press Enter to open or Space to select.`}
		</div>
	</button>
);

const renderUnsupported = (ctx: RenderCtx) => (
	<div
		className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''} ${ctx.className}`}
		data-item-id={(ctx.entity as any).id}
	>
		<p>Tipo de entidad no soportado ({getEntityStatsType(ctx.entity as any)})</p>
	</div>
);

const RENDERERS: Record<string, (ctx: RenderCtx) => React.ReactElement> = {
	image: renderImage,
	video: renderVideo,
	album: renderAlbum,
	collection: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<CollectionCard
				className={ctx.className}
				collection={ctx.entity as any}
				compact={ctx.config.layout === 'compact' || ctx.config.size === 'sm'}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				showEntitiesCount={ctx.config.showStats}
				showImagesCount={ctx.config.showStats}
			/>
		</div>
	),
	character: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''} ${ctx.className}`}
			data-item-id={(ctx.entity as any).id}
		>
			<p>Character Card - En desarrollo</p>
		</div>
	),
	folder: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<FolderCard
				className={ctx.className}
				folder={ctx.entity as any}
				interactive={!!ctx.finalOnClick}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
			/>
		</div>
	),
	audio: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<AudioCard
				audio={ctx.entity as any}
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
			/>
		</div>
	),
	document: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<DocumentCard
				className={ctx.className}
				document={ctx.entity as any}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)() : undefined}
			/>
		</div>
	),
	tag: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<TagCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				tag={ctx.entity as any}
			/>
		</div>
	),
	note: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''} ${ctx.className}`}
			data-item-id={(ctx.entity as any).id}
		>
			<p>Note Card - En desarrollo</p>
		</div>
	),
	place: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<PlaceCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				place={ctx.entity as any}
			/>
		</div>
	),
	'world-item': (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<WorldItemCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				worldItemId={(ctx.entity as any).id}
			/>
		</div>
	),
	'uploaded-image': (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<UploadedImageCard className={ctx.className} uploadedImage={ctx.entity as any} />
		</div>
	),
	concept: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<ConceptCard
				className={ctx.className}
				concept={ctx.entity as any}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)() : undefined}
			/>
		</div>
	),
	prompt: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<PromptCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				prompt={ctx.entity as any}
			/>
		</div>
	),
	property: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<PropertyCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				property={ctx.entity as any}
			/>
		</div>
	),
	group: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<GroupCard
				className={ctx.className}
				group={ctx.entity as any}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)() : undefined}
			/>
		</div>
	),
	wildcard: (ctx) => (
		<div
			className={`entity-card ${ctx.isSelected ? 'entity-card--selected' : ''}`}
			data-item-id={(ctx.entity as any).id}
		>
			<WildcardCard
				className={ctx.className}
				onClick={ctx.finalOnClick ? () => (ctx.finalOnClick as any)({} as any) : undefined}
				wildcard={ctx.entity as any}
			/>
		</div>
	),
};

const renderEntityByType = (type: string, ctx: RenderCtx) => {
	const renderer = RENDERERS[type] || renderUnsupported;
	return renderer(ctx);
};

export interface EntityCardProps extends BaseCardProps {
	entity: AnyEntityWithStats;
	/** Preset de  específico para el contexto */
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
		Config,
		layout,
		size,
		variant,
		preset,
		thumbnailQuality,
		// Props legacy para compatibilidad
		compact,
		tcgMode,
		...props
	}) => {
		// debug: handlers recibidos (se removió console por reglas de estilo)
		// Extraer handlers *ById de props si existen
		const { onClickById, onDoubleClickById, itemId, ...restProps } = props as any;

		// Convertir handlers *ById en handlers normales si no hay handlers directos
		const finalOnClick =
			onClick || (onClickById && itemId ? (e: React.MouseEvent) => onClickById(itemId, e) : undefined);
		const finalOnDoubleClick =
			onDoubleClick || (onDoubleClickById && itemId ? () => onDoubleClickById(itemId) : undefined);

		// debug: estado final de handlers (se removió console por reglas de estilo)

		// debug: estado final de handlers (removido console por reglas de estilo)
		// Usar el hook de layout para obtener la configuración
		const { config } = useCardLayout(
			{
				Config,
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

		// Si el modo es TCG, usar el nuevo componente TCGEntityCard
		if (config.variant === 'tcg') {
			return (
				<TCGEntityCard
					className={className}
					disable3D={false}
					entity={entity}
					isCompact={compact}
					isSelected={isSelected}
					onClick={finalOnClick}
					onDoubleClick={finalOnDoubleClick}
					size={config.size as 'sm' | 'md' | 'lg' | 'xl'}
					thumbnailQuality={thumbnailQuality}
				/>
			);
		}

		// Render genérico por tipo para otras variantes
		const type = getEntityStatsType(entity as any) ?? 'unknown';
		return renderEntityByType(type as string, {
			entity,
			isSelected,
			className,
			config,
			finalOnClick,
			finalOnDoubleClick,
			thumbnailQuality,
		});
	}
);

/**
 * 📝 Documentación de migración:
 *
									metaKey: e.metaKey,
								} as unknown as React.MouseEvent;
								onClick(syntheticEvent);
							}
						}
					}}
 * Para migrar:
 * 1. Importar EntityCardV2 en lugar de EntityCard
 * 2. Pasar EntityWithStats en lugar de AnyEntity
 * 3. Actualizar props según la interfaz EntityCardV2Props
 */

// Export alias for backward compatibility
export const OptimizedEntityCard = EntityCard;
