/**
 * @file Transiciones para File Viewer
 * @module components/features/file-viewer/file-viewer-transitions
 * @description Envoltorios con transiciones para el visor de archivos
 */

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlipContainer, TransitionGroup, TransitionItem, AnimatePresence } from '@/components/transitions';
import { useFlip, useEnterExit } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';

// ============================================================================
// Transición de Apertura/Cierre del File Viewer
// ============================================================================

interface FileViewerTransitionProps {
  /** Si el viewer está abierto */
  isOpen: boolean;
  /** Contenido */
  children: React.ReactNode;
  /** ID del archivo actual */
  fileId?: string;
  /** Callback al cerrar */
  onClose?: () => void;
}

/**
 * Envoltorio con transiciones para el FileViewer
 * 
 * @example
 * ```tsx
 * <FileViewerTransition isOpen={isOpen} fileId={currentFile?.id}>
 *   <FileViewerContent file={currentFile} />
 * </FileViewerTransition>
 * ```
 */
export function FileViewerTransition({
  isOpen,
  children,
  fileId,
  onClose,
}: FileViewerTransitionProps) {
  const { ref, enter, exit, isTransitioning } = useEnterExit({
    id: `file-viewer-${fileId || 'default'}`,
    isVisible: isOpen,
    enterConfig: {
      type: 'scale',
      direction: 'center',
      initialScale: 0.9,
      duration: 350,
      easing: customEasings.easeOutSuper,
    },
    exitConfig: {
      type: 'scale',
      direction: 'center',
      finalScale: 0.95,
      duration: 250,
      easing: customEasings.easeInSuper,
    },
    onExitComplete: onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'file-viewer-transition fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black/80 backdrop-blur-sm',
        isTransitioning && 'transitioning'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          exit();
        }
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Transición entre archivos (navegación)
// ============================================================================

interface FileNavigationTransitionProps {
  /** ID del archivo actual */
  currentFileId: string;
  /** Dirección de navegación */
  direction: 'next' | 'previous';
  /** Contenido */
  children: React.ReactNode;
}

/**
 * Transición entre archivos al navegar
 */
export function FileNavigationTransition({
  currentFileId,
  direction,
  children,
}: FileNavigationTransitionProps) {
  const slideDirection = direction === 'next' ? 100 : -100;
  
  return (
    <AnimatePresence
      present={true}
      enter={{
        type: 'slide',
        direction: direction === 'next' ? 'right' : 'left',
        distance: 50,
        duration: 300,
        easing: customEasings.easeOutSuper,
      }}
      exit={{
        type: 'slide',
        direction: direction === 'next' ? 'left' : 'right',
        distance: 50,
        duration: 250,
        easing: customEasings.easeInSuper,
      }}
    >
      <div key={currentFileId} className="file-navigation-content">
        {children}
      </div>
    </AnimatePresence>
  );
}

// ============================================================================
// Transición de thumbnails
// ============================================================================

interface ThumbnailTransitionProps {
  /** ID de la thumbnail */
  thumbnailId: string;
  /** Si está seleccionada */
  isSelected?: boolean;
  /** Si está activa (hover) */
  isActive?: boolean;
  /** Contenido */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Transición para thumbnails individuales
 */
export function ThumbnailTransition({
  thumbnailId,
  isSelected,
  isActive,
  children,
  onClick,
}: ThumbnailTransitionProps) {
  const { ref, isVisible, enter, exit } = useEnterExit({
    id: `thumbnail-${thumbnailId}`,
    isVisible: true,
    enterConfig: {
      type: 'scale',
      initialScale: 0.8,
      duration: 250,
      easing: customEasings.easeOutSuper,
    },
    exitConfig: {
      type: 'scale',
      finalScale: 0.8,
      duration: 200,
      easing: customEasings.easeInSuper,
    },
  });

  const handleClick = async () => {
    if (onClick) {
      // Animar selección antes de callback
      await enter();
      onClick();
    }
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'thumbnail-transition',
        'transition-all duration-200',
        isSelected && 'scale-105 ring-2 ring-primary',
        isActive && 'scale-102',
        'hover:scale-105 cursor-pointer'
      )}
      onClick={handleClick}
      style={{
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Grid de thumbnails con transiciones
// ============================================================================

interface ThumbnailGridTransitionProps {
  /** IDs de las thumbnails */
  thumbnailIds: string[];
  /** ID seleccionado */
  selectedId?: string;
  /** Render de cada thumbnail */
  renderThumbnail: (id: string, index: number) => React.ReactNode;
  /** Cambio de selección */
  onSelect?: (id: string) => void;
}

/**
 * Grid de thumbnails con transiciones coordinadas
 */
export function ThumbnailGridTransition({
  thumbnailIds,
  selectedId,
  renderThumbnail,
  onSelect,
}: ThumbnailGridTransitionProps) {
  return (
    <TransitionGroup
      id="thumbnail-grid"
      isVisible={true}
      enterConfig={{
        type: 'scale',
        initialScale: 0.8,
        duration: 300,
        easing: customEasings.easeOutSuper,
      }}
      exitConfig={{
        type: 'scale',
        finalScale: 0.8,
        duration: 200,
        easing: customEasings.easeInSuper,
      }}
      staggerDelay={30}
      className="flex gap-2 overflow-x-auto p-2"
    >
      {thumbnailIds.map((id, index) => (
        <TransitionItem key={id} id={`thumb-${id}`} index={index}>
          <div
            className={cn(
              'flex-shrink-0',
              selectedId === id && 'ring-2 ring-primary rounded-lg'
            )}
            onClick={() => onSelect?.(id)}
          >
            {renderThumbnail(id, index)}
          </div>
        </TransitionItem>
      ))}
    </TransitionGroup>
  );
}

// ============================================================================
// Transición de toolbar
// ============================================================================

interface ToolbarTransitionProps {
  /** Si está visible */
  isVisible: boolean;
  /** Posición */
  position?: 'top' | 'bottom';
  /** Contenido */
  children: React.ReactNode;
}

/**
 * Toolbar con transiciones de entrada/salida
 */
export function ToolbarTransition({
  isVisible,
  position = 'bottom',
  children,
}: ToolbarTransitionProps) {
  const direction = position === 'top' ? 'top' : 'bottom';
  
  return (
    <AnimatePresence
      present={isVisible}
      enter={{
        type: 'slide',
        direction: direction === 'top' ? 'top' : 'bottom',
        distance: 30,
        duration: 300,
        easing: customEasings.easeOutSuper,
      }}
      exit={{
        type: 'slide',
        direction: direction === 'top' ? 'bottom' : 'top',
        distance: 20,
        duration: 200,
        easing: customEasings.easeInSuper,
      }}
    >
      <div
        className={cn(
          'toolbar-transition',
          'absolute left-0 right-0',
          position === 'top' && 'top-0',
          position === 'bottom' && 'bottom-0'
        )}
      >
        {children}
      </div>
    </AnimatePresence>
  );
}
