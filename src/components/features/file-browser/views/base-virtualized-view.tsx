/**
 * @file Componente base para vistas virtualizadas con detección mejorada de altura
 * @module components/features/file-browser/views/base-virtualized-view
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';

interface UseVirtualizedContainerProps {
	initialHeight?: number;
	minHeight?: number;
	paddingTop?: number;
	paddingBottom?: number;
}

interface VirtualizedContainerDimensions {
	containerHeight: number;
	containerWidth: number;
	isReady: boolean;
}

const logger = clientLogger.withContext('BaseVirtualizedView');

/**
 * Hook personalizado para manejar la detección de dimensiones del contenedor
 * con ResizeObserver y fallbacks robustos
 */
export function useVirtualizedContainer({
	initialHeight = 600,
	minHeight = 400,
	paddingTop = 0,
	paddingBottom = 0,
}: UseVirtualizedContainerProps = {}): [React.RefObject<HTMLDivElement | null>, VirtualizedContainerDimensions] {
	const parentRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState<number>(initialHeight);
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [isReady, setIsReady] = useState<boolean>(false);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const updateDimensions = useCallback(
		(element: Element) => {
			const rect = element.getBoundingClientRect();
			let newHeight = Math.max(rect.height - paddingTop - paddingBottom, minHeight);
			let newWidth = rect.width;

			// Si las dimensiones son muy pequeñas, intentar con diferentes estrategias
			if (newHeight < minHeight || newWidth < 100) {
				// Estrategia 1: Buscar el contenedor de scroll más cercano
				const scrollContainer =
					element.closest('[data-radix-scroll-area-viewport]') ||
					element.closest('.overflow-auto') ||
					element.closest('.h-full');

				if (scrollContainer) {
					const scrollRect = scrollContainer.getBoundingClientRect();
					if (scrollRect.height > newHeight) {
						newHeight = Math.max(scrollRect.height - paddingTop - paddingBottom, minHeight);
					}
					if (scrollRect.width > newWidth) {
						newWidth = scrollRect.width;
					}
				}

				// Estrategia 2: Si aún es muy pequeño, usar el viewport
				if (newHeight < minHeight) {
					const viewportHeight = window.innerHeight;
					newHeight = Math.max(viewportHeight * 0.6, minHeight); // 60% del viewport como fallback
				}
				if (newWidth < 100) {
					const viewportWidth = window.innerWidth;
					newWidth = Math.max(viewportWidth * 0.8, 300); // 80% del viewport como fallback
				}
			}

			if (Math.abs(newHeight - containerHeight) > 1 || Math.abs(newWidth - containerWidth) > 1) {
				logger.debug('📏 Actualizando dimensiones del contenedor:', {
					height: `${containerHeight}px → ${newHeight}px`,
					width: `${containerWidth}px → ${newWidth}px`,
					element: element.tagName,
					rect: `${rect.width}x${rect.height}`,
				});

				setContainerHeight(newHeight);
				setContainerWidth(newWidth);

				if (!isReady && newHeight > minHeight && newWidth > 100) {
					setIsReady(true);
					logger.info('✅ Contenedor virtualizado listo:', { height: newHeight, width: newWidth });
				}
			}
		},
		[containerHeight, containerWidth, isReady, minHeight, paddingTop, paddingBottom]
	);

	const measureContainer = useCallback(() => {
		if (!parentRef.current) return;

		const element = parentRef.current;

		// Buscar el viewport de ScrollArea más cercano
		const scrollAreaViewport = element.closest('[data-radix-scroll-area-viewport]') as Element;
		const targetElement = scrollAreaViewport || element.parentElement || element;

		updateDimensions(targetElement);
	}, [updateDimensions]);

	useEffect(() => {
		if (!parentRef.current) return;

		const element = parentRef.current;

		// Buscar el viewport de ScrollArea más cercano
		const scrollAreaViewport = element.closest('[data-radix-scroll-area-viewport]') as Element;
		const targetElement = scrollAreaViewport || element.parentElement || element;

		// Medición inicial después de un pequeño delay para permitir que el DOM se estabilice
		measurementTimeoutRef.current = setTimeout(() => {
			updateDimensions(targetElement);
		}, 50);

		// Configurar ResizeObserver para cambios dinámicos
		resizeObserverRef.current = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				let adjustedHeight = Math.max(height - paddingTop - paddingBottom, minHeight);
				let adjustedWidth = width;

				// Aplicar las mismas estrategias de fallback que en updateDimensions
				if (adjustedHeight < minHeight || adjustedWidth < 100) {
					const scrollContainer =
						element.closest('[data-radix-scroll-area-viewport]') ||
						element.closest('.overflow-auto') ||
						element.closest('.h-full');

					if (scrollContainer) {
						const scrollRect = scrollContainer.getBoundingClientRect();
						if (scrollRect.height > adjustedHeight) {
							adjustedHeight = Math.max(scrollRect.height - paddingTop - paddingBottom, minHeight);
						}
						if (scrollRect.width > adjustedWidth) {
							adjustedWidth = scrollRect.width;
						}
					}
				}

				if (
					adjustedWidth > 0 &&
					adjustedHeight > 0 &&
					(Math.abs(adjustedHeight - containerHeight) > 1 || Math.abs(adjustedWidth - containerWidth) > 1)
				) {
					logger.debug('🔄 ResizeObserver detectó cambio:', {
						height: `${containerHeight}px → ${adjustedHeight}px`,
						width: `${containerWidth}px → ${adjustedWidth}px`,
						original: `${width}x${height}`,
					});

					setContainerHeight(adjustedHeight);
					setContainerWidth(adjustedWidth);

					if (!isReady && adjustedHeight > minHeight && adjustedWidth > 100) {
						setIsReady(true);
						logger.info('✅ Contenedor virtualizado listo (ResizeObserver)');
					}
				}
			}
		});

		resizeObserverRef.current.observe(targetElement);

		// Fallback con requestAnimationFrame si ResizeObserver no funciona inmediatamente
		const rafId = requestAnimationFrame(() => {
			updateDimensions(targetElement);
		});

		return () => {
			if (measurementTimeoutRef.current) {
				clearTimeout(measurementTimeoutRef.current);
			}
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
			cancelAnimationFrame(rafId);
		};
	}, [paddingTop, paddingBottom, minHeight, updateDimensions, containerHeight, containerWidth, isReady]);

	return [
		parentRef,
		{
			containerHeight,
			containerWidth,
			isReady,
		},
	];
}

/**
 * Props base para todos los componentes de vista virtualizada
 */
export interface BaseVirtualizedViewProps<T> {
	items: T[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: T, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: T) => void;
	onItemContextMenu?: (item: T, e: React.MouseEvent) => void;
}

/**
 * Componente wrapper que proporciona estilos base y prevención de overlapping
 */
interface VirtualizedContainerProps {
	children: React.ReactNode;
	height: number;
	width: number;
	padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
	className?: string;
	isReady?: boolean;
	onClick?: (e: React.MouseEvent) => void;
}

export const VirtualizedContainer = React.forwardRef<HTMLDivElement, VirtualizedContainerProps>(
	function VirtualizedContainer(
		{ children, height, width, padding = 16, className = '', isReady = true, onClick },
		ref
	) {
		const paddingObj =
			typeof padding === 'number'
				? { top: padding, bottom: padding, left: padding, right: padding }
				: { top: 0, bottom: 0, left: 0, right: 0, ...padding };

		if (!isReady) {
			return (
				<div
					className={`flex select-none items-center justify-center text-muted-foreground ${className}`}
					ref={ref}
					style={{
						height: `${height}px`,
						width: `${width}px`,
						padding: `${paddingObj.top}px ${paddingObj.right}px ${paddingObj.bottom}px ${paddingObj.left}px`,
						position: 'relative',
						zIndex: 1,
						userSelect: 'none',
					}}
				>
					<div className="animate-pulse">Preparando vista...</div>
				</div>
			);
		}

		return (
			<div
				className={`relative select-none ${className}`}
				onClick={onClick}
				ref={ref}
				style={{
					height: `${height}px`,
					width: `${width}px`,
					minHeight: `${height}px`,
					maxHeight: `${height}px`,
					minWidth: `${width}px`,
					maxWidth: `${width}px`,
					contain: 'layout style size',
					padding: `${paddingObj.top}px ${paddingObj.right}px ${paddingObj.bottom}px ${paddingObj.left}px`,
					overflow: 'hidden',
					position: 'relative',
					zIndex: 1,
					isolation: 'isolate', // Crear un nuevo contexto de apilamiento
					userSelect: 'none', // Prevent text selection
				}}
			>
				{children}
			</div>
		);
	}
);
