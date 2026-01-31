/**
 * @file Transiciones para Paneles
 * @module components/panels/panel-transitions
 * @description Envoltorios con transiciones para paneles de navegación y detalles
 */

import React from 'react';
import { FlipContainer } from '@/components/transitions/FlipContainer';
import { AnimatePresence } from '@/components/transitions/TransitionGroup';
import { useEnterExit } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Transición del Panel de Navegación (Izquierdo)
// ============================================================================

interface NavPanelTransitionProps {
	/** Si está expandido */
	isExpanded: boolean;
	/** Si está animando */
	isAnimating?: boolean;
	/** Contenido */
	children: React.ReactNode;
	/** Ancho cuando está expandido */
	expandedWidth?: string;
	/** Ancho cuando está colapsado */
	collapsedWidth?: string;
}

/**
 * Panel de navegación con transiciones fluidas
 * NOTA: El ancho es controlado por react-resizable-panels, no por CSS
 */
export function NavPanelTransition({ isExpanded, isAnimating, children }: NavPanelTransitionProps) {
	return (
		<FlipContainer
			className={cn(
				'nav-panel-transition h-full w-full',
				'flex flex-col',
				'overflow-hidden',
				isAnimating && 'animating'
			)}
			flipId="nav-panel"
			options={{
				duration: 350,
				easing: customEasings.slideSmooth,
				animateBorderRadius: true,
			}}
		>
			{children}
		</FlipContainer>
	);
}

// ============================================================================
// Transición del Panel de Detalles (Derecho)
// ============================================================================

interface DetailsPanelTransitionProps {
	/** Si está visible */
	isVisible: boolean;
	/** Si está animando */
	isAnimating?: boolean;
	/** Contenido */
	children: React.ReactNode;
	/** Contenido del header */
	header?: React.ReactNode;
	/** Contenido del footer */
	footer?: React.ReactNode;
}

/**
 * Panel de detalles con transiciones
 */
export function DetailsPanelTransition({
	isVisible,
	isAnimating,
	children,
	header,
	footer,
}: DetailsPanelTransitionProps) {
	const { ref, isTransitioning } = useEnterExit({
		id: 'details-panel',
		isVisible,
		enterConfig: {
			type: 'slide',
			direction: 'right',
			distance: 40,
			duration: 350,
			easing: customEasings.easeOutSuper,
		},
		exitConfig: {
			type: 'slide',
			direction: 'right',
			distance: 30,
			duration: 250,
			easing: customEasings.easeInSuper,
		},
	});

	if (!(isVisible || isTransitioning)) return null;

	return (
		<div
			className={cn('details-panel-transition flex h-full flex-col', 'bg-background', isAnimating && 'animating')}
			ref={ref as React.RefObject<HTMLDivElement>}
		>
			{header && <div className="details-panel-header flex-shrink-0 border-border border-b p-4">{header}</div>}

			<div className="details-panel-content flex-1 overflow-auto p-4">{children}</div>

			{footer && <div className="details-panel-footer flex-shrink-0 border-border border-t p-4">{footer}</div>}
		</div>
	);
}

// ============================================================================
// Transición de Items del Panel
// ============================================================================

interface PanelItemTransitionProps {
	/** ID del item */
	itemId: string;
	/** Índice para stagger */
	index?: number;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Si está activo (hover) */
	isActive?: boolean;
	/** Contenido */
	children: React.ReactNode;
	/** Click handler */
	onClick?: () => void;
}

/**
 * Item individual del panel con transiciones
 */
export function PanelItemTransition({
	itemId,
	index = 0,
	isSelected,
	isActive,
	children,
	onClick,
}: PanelItemTransitionProps) {
	const baseDelay = index * 20;

	return (
		<FlipContainer
			className={cn(
				'panel-item-transition',
				'rounded-lg transition-colors',
				isSelected && 'bg-accent',
				isActive && 'bg-accent/50',
				onClick && 'cursor-pointer hover:bg-accent/30',
				'p-2'
			)}
			flipId={`panel-item-${itemId}`}
			onClick={onClick}
			options={{
				duration: 300,
				delay: Math.min(baseDelay, 300),
				easing: customEasings.easeOutSuper,
			}}
		>
			{children}
		</FlipContainer>
	);
}

// ============================================================================
// Transición de Secciones del Panel
// ============================================================================

interface PanelSectionTransitionProps {
	/** ID de la sección */
	sectionId: string;
	/** Título */
	title?: React.ReactNode;
	/** Si está expandida */
	isExpanded?: boolean;
	/** Contenido */
	children: React.ReactNode;
	/** Toggle expand */
	onToggle?: () => void;
}

/**
 * Sección colapsable del panel con transiciones
 */
export function PanelSectionTransition({
	sectionId,
	title,
	isExpanded = true,
	children,
	onToggle,
}: PanelSectionTransitionProps) {
	const { ref, isTransitioning } = useEnterExit({
		id: `panel-section-${sectionId}`,
		isVisible: isExpanded,
		enterConfig: {
			type: 'clip',
			duration: 300,
			easing: customEasings.easeOutSuper,
		},
		exitConfig: {
			type: 'clip',
			duration: 200,
			easing: customEasings.easeInSuper,
		},
	});

	return (
		<div className="panel-section-transition">
			{title && (
				<button
					className={cn(
						'panel-section-header flex w-full items-center justify-between',
						'p-2 font-medium text-muted-foreground text-sm',
						'transition-colors hover:text-foreground',
						'rounded-lg hover:bg-accent/50'
					)}
					onClick={onToggle}
					type="button"
				>
					{title}
					<span className={cn('transform transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}>
						▼
					</span>
				</button>
			)}

			{(isExpanded || isTransitioning) && (
				<div
					className={cn('panel-section-content overflow-hidden', 'origin-top')}
					ref={ref as React.RefObject<HTMLDivElement>}
				>
					{children}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Transición de Resizable Panels
// ============================================================================

interface ResizablePanelTransitionProps {
	/** ID del panel */
	panelId: string;
	/** Tamaño actual (%) */
	size: number;
	/** Si está colapsado */
	isCollapsed: boolean;
	/** Contenido */
	children: React.ReactNode;
}

/**
 * Panel redimensionable con transiciones suaves
 */
export function ResizablePanelTransition({ panelId, size, isCollapsed, children }: ResizablePanelTransitionProps) {
	return (
		<FlipContainer
			className={cn('resizable-panel-transition h-full', isCollapsed && 'collapsed')}
			flipId={`resizable-panel-${panelId}`}
			options={{
				duration: 350,
				easing: customEasings.slideSmooth,
			}}
			style={{
				flex: isCollapsed ? '0 0 auto' : `0 0 ${size}%`,
			}}
		>
			{children}
		</FlipContainer>
	);
}

// ============================================================================
// Transición de Overlay/Modal del Panel
// ============================================================================

interface PanelOverlayTransitionProps {
	/** Si está visible */
	isVisible: boolean;
	/** Contenido */
	children: React.ReactNode;
	/** Cerrar al click */
	onClose?: () => void;
}

/**
 * Overlay del panel con transición
 */
export function PanelOverlayTransition({ isVisible, children, onClose }: PanelOverlayTransitionProps) {
	return (
		<AnimatePresence
			enter={{
				type: 'scale',
				direction: 'center',
				initialScale: 0.95,
				duration: 250,
				easing: customEasings.easeOutSuper,
			}}
			exit={{
				type: 'scale',
				direction: 'center',
				finalScale: 0.95,
				duration: 200,
				easing: customEasings.easeInSuper,
			}}
			present={isVisible}
		>
			<div className="panel-overlay fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose}>
				<div className="panel-overlay-content absolute" onClick={(e) => e.stopPropagation()}>
					{children}
				</div>
			</div>
		</AnimatePresence>
	);
}
