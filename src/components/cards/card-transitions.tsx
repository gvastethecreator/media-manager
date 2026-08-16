/**
 * @file Transiciones para Tarjetas de Entidades
 * @module components/cards/card-transitions
 * @description Envoltorios con transiciones para tarjetas de carpetas, imágenes, etc.
 */

import React, { useCallback } from 'react';
import { FlipContainer } from '@/components/transitions/flip-container';
import { TransitionGroup, TransitionItem } from '@/components/transitions/transition-group';
import { useEntityCardTransition } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Props Base
// ============================================================================

interface EntityCardTransitionBaseProps {
	/** Contenido */
	children: React.ReactNode;
	/** ID de la entidad */
	entityId: string;
	/** Tipo de entidad */
	entityType: 'folder' | 'image' | 'video' | 'audio' | 'document' | 'tag' | 'character' | 'collection' | 'album';
	/** Si está seleccionada */
	isSelected?: boolean;
	/** Click handler */
	onClick?: () => void;
	/** Doble click handler */
	onDoubleClick?: () => void;
}

// ============================================================================
// Transición de Tarjeta de Entidad
// ============================================================================

interface EntityCardTransitionProps extends EntityCardTransitionBaseProps {
	/** Clases adicionales */
	className?: string;
	/** Si es modo compacto */
	isCompact?: boolean;
	/** Si está favorito */
	isFavorite?: boolean;
}

/**
 * Tarjeta de entidad con transiciones FLIP y estado
 */
export function EntityCardTransition({
	entityId,
	entityType,
	isSelected,
	isCompact,
	isFavorite,
	children,
	onClick,
	onDoubleClick,
	className,
}: EntityCardTransitionProps) {
	const { cardRef, handleCardClick, handleSelectionChange, isTransitioning, transitionClasses } =
		useEntityCardTransition({
			entityId,
			entityType,
			isSelected,
		});

	const handleClick = useCallback(() => {
		handleCardClick(() => onClick?.());
	}, [handleCardClick, onClick]);

	// Aplicar clase de selección cuando cambia
	React.useEffect(() => {
		if (isSelected !== undefined) {
			handleSelectionChange(isSelected);
		}
	}, [isSelected, handleSelectionChange]);

	return (
		<FlipContainer
			className={cn(
				'entity-card-transition',
				'group relative overflow-hidden rounded-lg',
				'border border-border bg-card',
				'transition-shadow duration-200',
				'hover:shadow-md',
				isSelected && 'shadow-md ring-2 ring-primary',
				isFavorite && 'ring-1 ring-yellow-400/50',
				isCompact && 'compact',
				isTransitioning && 'transitioning',
				transitionClasses,
				className
			)}
			flipId={`entity-card-${entityId}`}
			onClick={handleClick}
			onDoubleClick={onDoubleClick}
			options={{
				duration: 350,
				easing: customEasings.easeOutSuper,
				animateBorderRadius: true,
			}}
		>
			{/* Indicador de favorito */}
			{isFavorite && <div className="absolute top-2 right-2 z-10 text-yellow-500">★</div>}

			{/* Indicador de tipo */}
			<div
				className={cn(
					'entity-type-indicator absolute top-2 left-2 z-10',
					'h-2 w-2 rounded-full',
					entityType === 'folder' && 'bg-entity-folder',
					entityType === 'image' && 'bg-entity-image',
					entityType === 'video' && 'bg-entity-video',
					entityType === 'audio' && 'bg-entity-audio',
					entityType === 'document' && 'bg-entity-document',
					entityType === 'tag' && 'bg-entity-tag',
					entityType === 'character' && 'bg-entity-character',
					entityType === 'collection' && 'bg-entity-collection',
					entityType === 'album' && 'bg-entity-album'
				)}
				style={{
					backgroundColor:
						entityType === 'folder'
							? 'var(--entity-folder)'
							: entityType === 'image'
								? 'var(--entity-image)'
								: entityType === 'video'
									? 'var(--entity-video)'
									: entityType === 'audio'
										? 'var(--entity-audio)'
										: entityType === 'document'
											? 'var(--entity-document)'
											: entityType === 'tag'
												? 'var(--entity-tag)'
												: entityType === 'character'
													? 'var(--entity-character)'
													: entityType === 'collection'
														? 'var(--entity-collection)'
														: entityType === 'album'
															? 'var(--entity-album)'
															: undefined,
				}}
			/>

			{children}
		</FlipContainer>
	);
}

// ============================================================================
// Grid de Tarjetas con Transiciones
// ============================================================================

interface EntityCardGridTransitionProps {
	/** Columnas para grid */
	columns?: number;
	/** IDs de las entidades */
	entityIds: string[];
	/** Tipo de layout */
	layout?: 'grid' | 'list' | 'masonry';
	/** Render de cada tarjeta */
	renderCard: (id: string, index: number) => React.ReactNode;
}

/**
 * Grid de tarjetas con transiciones coordinadas
 */
export function EntityCardGridTransition({
	entityIds,
	renderCard,
	layout = 'grid',
	columns = 4,
}: EntityCardGridTransitionProps) {
	return (
		<TransitionGroup
			className={cn(
				'entity-card-grid-transition',
				layout === 'grid' && 'grid gap-4',
				layout === 'list' && 'flex flex-col gap-2',
				layout === 'masonry' && 'columns-2 gap-4 md:columns-3 lg:columns-4'
			)}
			enterConfig={{
				type: 'scale',
				initialScale: 0.85,
				duration: 350,
				easing: customEasings.easeOutSuper,
			}}
			exitConfig={{
				type: 'scale',
				finalScale: 0.9,
				duration: 250,
				easing: customEasings.easeInSuper,
			}}
			id={`entity-grid-${layout}`}
			isVisible={true}
			maxStaggerDelay={500}
			staggerDelay={30}
			staggerDirection="forward"
		>
			{entityIds.map((id, index) => (
				<TransitionItem id={`entity-${id}`} index={index} key={id}>
					{renderCard(id, index)}
				</TransitionItem>
			))}
		</TransitionGroup>
	);
}

// ============================================================================
// Transición de Lista de Entidades
// ============================================================================

interface EntityListTransitionProps {
	/** Si usar dividers */
	dividers?: boolean;
	/** IDs de las entidades */
	entityIds: string[];
	/** Render de cada item */
	renderItem: (id: string, index: number) => React.ReactNode;
}

/**
 * Lista de entidades con transiciones
 */
export function EntityListTransition({ entityIds, renderItem, dividers = true }: EntityListTransitionProps) {
	return (
		<TransitionGroup
			className={cn('entity-list-transition', dividers && 'divide-y divide-border')}
			enterConfig={{
				type: 'slide',
				direction: 'right',
				distance: 20,
				duration: 300,
				easing: customEasings.easeOutSuper,
			}}
			exitConfig={{
				type: 'slide',
				direction: 'left',
				distance: 15,
				duration: 200,
				easing: customEasings.easeInSuper,
			}}
			id="entity-list"
			isVisible={true}
			staggerDelay={20}
		>
			{entityIds.map((id, index) => (
				<TransitionItem id={`list-item-${id}`} index={index} key={id}>
					{renderItem(id, index)}
				</TransitionItem>
			))}
		</TransitionGroup>
	);
}

// ============================================================================
// Transición de Tarjeta Expansible
// ============================================================================

interface ExpandableCardTransitionProps {
	/** ID de la tarjeta */
	cardId: string;
	/** Contenido compacto */
	compactContent: React.ReactNode;
	/** Contenido expandido */
	expandedContent: React.ReactNode;
	/** Si está expandida */
	isExpanded: boolean;
	/** Toggle expand */
	onToggle: () => void;
}

/**
 * Tarjeta que se expande con transición FLIP
 */
export function ExpandableCardTransition({
	cardId,
	isExpanded,
	compactContent,
	expandedContent,
	onToggle,
}: ExpandableCardTransitionProps) {
	return (
		<FlipContainer
			className={cn(
				'expandable-card-transition',
				'overflow-hidden rounded-lg border border-border bg-card',
				isExpanded && 'expanded'
			)}
			flipId={`expandable-card-${cardId}`}
			options={{
				duration: 400,
				easing: customEasings.easeOutSuper,
				animateBorderRadius: true,
			}}
		>
			<button className="w-full text-left" onClick={onToggle} type="button">
				{compactContent}
			</button>

			{isExpanded && <div className="expanded-content border-border border-t p-4">{expandedContent}</div>}
		</FlipContainer>
	);
}

// ============================================================================
// Transición de Preview de Entidad
// ============================================================================

interface EntityPreviewTransitionProps {
	/** Contenido del preview */
	children: React.ReactNode;
	/** ID de la entidad */
	entityId: string;
	/** Si está visible */
	isVisible: boolean;
	/** Posición */
	position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Preview emergente de entidad
 */
export function EntityPreviewTransition({
	entityId,
	isVisible,
	children,
	position = 'right',
}: EntityPreviewTransitionProps) {
	const directions = {
		top: 'bottom',
		bottom: 'top',
		left: 'right',
		right: 'left',
	} as const;

	return (
		<TransitionGroup
			className={cn(
				'entity-preview-transition absolute z-30',
				'rounded-lg border border-border bg-popover p-3 shadow-lg',
				position === 'top' && 'bottom-full mb-2',
				position === 'bottom' && 'top-full mt-2',
				position === 'left' && 'right-full mr-2',
				position === 'right' && 'left-full ml-2'
			)}
			enterConfig={{
				type: 'slide',
				direction: directions[position],
				distance: 20,
				duration: 250,
				easing: customEasings.easeOutSuper,
			}}
			exitConfig={{
				type: 'slide',
				direction: directions[position],
				distance: 15,
				duration: 200,
				easing: customEasings.easeInSuper,
			}}
			id={`entity-preview-${entityId}`}
			isVisible={isVisible}
		>
			{children}
		</TransitionGroup>
	);
}
