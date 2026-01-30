/**
 * @file Transiciones para Tarjetas de Entidades
 * @module components/cards/card-transitions
 * @description Envoltorios con transiciones para tarjetas de carpetas, imágenes, etc.
 */

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FlipContainer, TransitionGroup, TransitionItem } from '@/components/transitions';
import { useEntityCardTransition } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';

// ============================================================================
// Props Base
// ============================================================================

interface EntityCardTransitionBaseProps {
  /** ID de la entidad */
  entityId: string;
  /** Tipo de entidad */
  entityType: 'folder' | 'image' | 'video' | 'audio' | 'document' | 'tag' | 'character' | 'collection' | 'album';
  /** Si está seleccionada */
  isSelected?: boolean;
  /** Contenido */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Doble click handler */
  onDoubleClick?: () => void;
}

// ============================================================================
// Transición de Tarjeta de Entidad
// ============================================================================

interface EntityCardTransitionProps extends EntityCardTransitionBaseProps {
  /** Si es modo compacto */
  isCompact?: boolean;
  /** Si está favorito */
  isFavorite?: boolean;
  /** Clases adicionales */
  className?: string;
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
  const { 
    cardRef, 
    handleCardClick, 
    handleSelectionChange, 
    isTransitioning,
    transitionClasses 
  } = useEntityCardTransition({
    entityId,
    entityType,
    isSelected,
  });

  const handleClick = useCallback(() => {
    handleCardClick(() => onClick?.());
  }, [handleCardClick, onClick]);

  // Aplicar clase de selección cuando cambia
  React.useEffect(() => {
    handleSelectionChange(isSelected || false);
  }, [isSelected, handleSelectionChange]);

  return (
    <FlipContainer
      flipId={`entity-card-${entityId}`}
      options={{
        duration: 350,
        easing: customEasings.easeOutSuper,
        animateBorderRadius: true,
      }}
      className={cn(
        'entity-card-transition',
        'group relative overflow-hidden rounded-lg',
        'border border-border bg-card',
        'transition-shadow duration-200',
        'hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md',
        isFavorite && 'ring-1 ring-yellow-400/50',
        isCompact && 'compact',
        isTransitioning && 'transitioning',
        transitionClasses,
        className
      )}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Indicador de favorito */}
      {isFavorite && (
        <div className="absolute top-2 right-2 z-10 text-yellow-500">
          ★
        </div>
      )}
      
      {/* Indicador de tipo */}
      <div className={cn(
        'entity-type-indicator absolute top-2 left-2 z-10',
        'w-2 h-2 rounded-full',
        entityType === 'folder' && 'bg-yellow-500',
        entityType === 'image' && 'bg-blue-500',
        entityType === 'video' && 'bg-red-500',
        entityType === 'audio' && 'bg-purple-500',
        entityType === 'document' && 'bg-gray-500',
        entityType === 'tag' && 'bg-green-500',
        entityType === 'character' && 'bg-pink-500',
        entityType === 'collection' && 'bg-indigo-500',
        entityType === 'album' && 'bg-orange-500',
      )} />
      
      {children}
    </FlipContainer>
  );
}

// ============================================================================
// Grid de Tarjetas con Transiciones
// ============================================================================

interface EntityCardGridTransitionProps {
  /** IDs de las entidades */
  entityIds: string[];
  /** Render de cada tarjeta */
  renderCard: (id: string, index: number) => React.ReactNode;
  /** Tipo de layout */
  layout?: 'grid' | 'list' | 'masonry';
  /** Columnas para grid */
  columns?: number;
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
      id={`entity-grid-${layout}`}
      isVisible={true}
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
      staggerDelay={30}
      maxStaggerDelay={500}
      staggerDirection="forward"
      className={cn(
        'entity-card-grid-transition',
        layout === 'grid' && `grid gap-4`,
        layout === 'list' && 'flex flex-col gap-2',
        layout === 'masonry' && 'columns-2 md:columns-3 lg:columns-4 gap-4'
      )}
      style={{
        gridTemplateColumns: layout === 'grid' ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
      }}
    >
      {entityIds.map((id, index) => (
        <TransitionItem key={id} id={`entity-${id}`} index={index}>
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
  /** IDs de las entidades */
  entityIds: string[];
  /** Render de cada item */
  renderItem: (id: string, index: number) => React.ReactNode;
  /** Si usar dividers */
  dividers?: boolean;
}

/**
 * Lista de entidades con transiciones
 */
export function EntityListTransition({
  entityIds,
  renderItem,
  dividers = true,
}: EntityListTransitionProps) {
  return (
    <TransitionGroup
      id="entity-list"
      isVisible={true}
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
      staggerDelay={20}
      className={cn(
        'entity-list-transition',
        dividers && 'divide-y divide-border'
      )}
    >
      {entityIds.map((id, index) => (
        <TransitionItem key={id} id={`list-item-${id}`} index={index}>
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
  /** Si está expandida */
  isExpanded: boolean;
  /** Contenido compacto */
  compactContent: React.ReactNode;
  /** Contenido expandido */
  expandedContent: React.ReactNode;
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
      flipId={`expandable-card-${cardId}`}
      options={{
        duration: 400,
        easing: customEasings.easeOutSuper,
        animateBorderRadius: true,
      }}
      className={cn(
        'expandable-card-transition',
        'rounded-lg border border-border bg-card overflow-hidden',
        isExpanded && 'expanded'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        {compactContent}
      </button>
      
      {isExpanded && (
        <div className="expanded-content border-t border-border p-4">
          {expandedContent}
        </div>
      )}
    </FlipContainer>
  );
}

// ============================================================================
// Transición de Preview de Entidad
// ============================================================================

interface EntityPreviewTransitionProps {
  /** ID de la entidad */
  entityId: string;
  /** Si está visible */
  isVisible: boolean;
  /** Contenido del preview */
  children: React.ReactNode;
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
      id={`entity-preview-${entityId}`}
      isVisible={isVisible}
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
      className={cn(
        'entity-preview-transition absolute z-30',
        'bg-popover border border-border rounded-lg shadow-lg p-3',
        position === 'top' && 'bottom-full mb-2',
        position === 'bottom' && 'top-full mt-2',
        position === 'left' && 'right-full mr-2',
        position === 'right' && 'left-full ml-2'
      )}
    >
      {children}
    </TransitionGroup>
  );
}
