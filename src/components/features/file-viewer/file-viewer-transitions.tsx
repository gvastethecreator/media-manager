/**
 * @file Transiciones para File Viewer
 * @module components/features/file-viewer/file-viewer-transitions
 * @description Envoltorios con transiciones para el visor de archivos
 */

import React from 'react';
import { AnimatePresence, TransitionGroup, TransitionItem } from '@/components/transitions/transition-group';
import { useEnterExit } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Transición de Apertura/Cierre del File Viewer
// ============================================================================

interface FileViewerTransitionProps {
	/** Contenido */
	children: React.ReactNode;
	/** ID del archivo actual */
	fileId?: string;
	/** Si el viewer está abierto */
	isOpen: boolean;
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
export function FileViewerTransition({ isOpen, children, fileId, onClose }: FileViewerTransitionProps) {
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
			ref={ref as React.RefObject<HTMLDivElement>}
		>
			{children}
		</div>
	);
}

// ============================================================================
// Transición entre archivos (navegación)
// ============================================================================

interface FileNavigationTransitionProps {
	/** Contenido */
	children: React.ReactNode;
	/** ID del archivo actual */
	currentFileId: string;
	/** Dirección de navegación */
	direction: 'next' | 'previous';
}

/**
 * Transición entre archivos al navegar
 */
export function FileNavigationTransition({ currentFileId, direction, children }: FileNavigationTransitionProps) {
	const slideDirection = direction === 'next' ? 100 : -100;

	return (
		<AnimatePresence
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
			present={true}
		>
			<div className="file-navigation-content" key={currentFileId}>
				{children}
			</div>
		</AnimatePresence>
	);
}

// ============================================================================
// Transición de thumbnails
// ============================================================================

interface ThumbnailTransitionProps {
	/** Contenido */
	children: React.ReactNode;
	/** Si está activa (hover) */
	isActive?: boolean;
	/** Si está seleccionada */
	isSelected?: boolean;
	/** Click handler */
	onClick?: () => void;
	/** ID de la thumbnail */
	thumbnailId: string;
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
			className={cn(
				'thumbnail-transition',
				'transition-all duration-200',
				isSelected && 'scale-105 ring-2 ring-primary',
				isActive && 'scale-102',
				'cursor-pointer hover:scale-105'
			)}
			onClick={handleClick}
			ref={ref as React.RefObject<HTMLDivElement>}
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
	/** Cambio de selección */
	onSelect?: (id: string) => void;
	/** Render de cada thumbnail */
	renderThumbnail: (id: string, index: number) => React.ReactNode;
	/** ID seleccionado */
	selectedId?: string;
	/** IDs de las thumbnails */
	thumbnailIds: string[];
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
			className="flex gap-2 overflow-x-auto p-2"
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
			id="thumbnail-grid"
			isVisible={true}
			staggerDelay={30}
		>
			{thumbnailIds.map((id, index) => (
				<TransitionItem id={`thumb-${id}`} index={index} key={id}>
					<div
						className={cn('flex-shrink-0', selectedId === id && 'rounded-lg ring-2 ring-primary')}
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
	/** Contenido */
	children: React.ReactNode;
	/** Si está visible */
	isVisible: boolean;
	/** Posición */
	position?: 'top' | 'bottom';
}

/**
 * Toolbar con transiciones de entrada/salida
 */
export function ToolbarTransition({ isVisible, position = 'bottom', children }: ToolbarTransitionProps) {
	const direction = position === 'top' ? 'top' : 'bottom';

	return (
		<AnimatePresence
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
			present={isVisible}
		>
			<div
				className={cn(
					'toolbar-transition',
					'absolute right-0 left-0',
					position === 'top' && 'top-0',
					position === 'bottom' && 'bottom-0'
				)}
			>
				{children}
			</div>
		</AnimatePresence>
	);
}
