/**
 * 🚀 Hook para virtualización con @tanstack/react-virtual
 *
 * Proporciona virtualización optimizada para listas grandes de elementos
 * con configuración dinámica desde ViewOptionsStore y compatibilidad con carga bajo demanda.
 */

import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

interface UseVirtualizationOptions {
	/** Elementos a virtualizar */
	items: unknown[];
	/** Altura estimada por defecto para elementos */
	estimateSize?: number;
	/** Forzar virtualización independientemente del umbral */
	forceEnabled?: boolean;
	/** Callback para obtener la altura real de un elemento */
	measureElement?: (index: number) => number;
	/** Orientación de la virtualización */
	horizontal?: boolean;
	/** Callback para carga bajo demanda cuando se acerca al final */
	onLoadMore?: () => void;
	/** ¿Hay más elementos por cargar? */
	hasMore?: boolean;
	/** ¿Está cargando más elementos? */
	isLoadingMore?: boolean;
	/** Umbral para activar carga (elementos desde el final) */
	loadMoreThreshold?: number;
}

interface VirtualizationResult {
	/** ¿Está la virtualización activa? */
	isVirtualized: boolean;
	/** Instancia del virtualizador */
	virtualizer: any | null;
	/** Elementos virtuales a renderizar */
	virtualItems: VirtualItem[];
	/** Props para el contenedor virtual */
	containerProps: {
		ref: React.RefObject<HTMLDivElement | null>;
		style: {
			height: string;
			width: string;
			position: 'relative';
		};
	} | null;
	/** Alto/ancho total calculado */
	totalSize: number;
	/** Índice del último elemento visible (para debug) */
	lastVisibleIndex?: number;
}

export function useVirtualization({
	items,
	estimateSize,
	forceEnabled = false,
	measureElement,
	horizontal = false,
	onLoadMore,
	hasMore = false,
	isLoadingMore = false,
	loadMoreThreshold = 5,
}: UseVirtualizationOptions): VirtualizationResult {
	const containerRef = useRef<HTMLDivElement>(null);
	const { virtualization } = useViewOptionsStore();

	// Determinar si la virtualización debe estar activa
	const shouldVirtualize = useMemo(() => {
		return forceEnabled || (virtualization.enabled && items.length >= virtualization.threshold);
	}, [forceEnabled, virtualization.enabled, items.length, virtualization.threshold]);

	// SIEMPRE llamar useVirtualizer incondicionalmente para cumplir reglas de Hooks
	// Sin límite maxItems fijo - permitir carga dinámica
	const effectiveCount = shouldVirtualize ? items.length : 0;

	const virtualizer = useVirtualizer({
		count: effectiveCount,
		getScrollElement: () => containerRef.current,
		estimateSize: () => (shouldVirtualize ? estimateSize || virtualization.estimatedItemHeight : 0),
		overscan: shouldVirtualize ? virtualization.overscan : 0,
		// Solo usar measureElement si shouldVirtualize está activo
		...(shouldVirtualize &&
			measureElement && {
				measureElement: (el) => {
					const index = Number(el.getAttribute('data-index'));
					return measureElement(index) || estimateSize || virtualization.estimatedItemHeight;
				},
			}),
		horizontal,
	});

	// Elementos virtuales a renderizar sin límites fijos
	const virtualItems = useMemo(() => {
		if (!shouldVirtualize) return [];
		return virtualizer.getVirtualItems();
	}, [virtualizer, shouldVirtualize]);

	// Detectar cuando se acerca al final para activar carga bajo demanda
	const lastVisibleIndex = useMemo(() => {
		if (!shouldVirtualize || virtualItems.length === 0) return -1;
		return Math.max(...virtualItems.map((item) => item.index));
	}, [shouldVirtualize, virtualItems]);

	// Efecto para carga bajo demanda
	useEffect(() => {
		if (!(shouldVirtualize && onLoadMore && hasMore) || isLoadingMore) return;

		const itemsFromEnd = items.length - lastVisibleIndex - 1;

		// Si estamos cerca del final (dentro del threshold), cargar más
		if (lastVisibleIndex >= 0 && itemsFromEnd <= loadMoreThreshold) {
			onLoadMore();
		}
	}, [shouldVirtualize, onLoadMore, hasMore, isLoadingMore, lastVisibleIndex, items.length, loadMoreThreshold]);

	// Props para el contenedor
	const containerProps = useMemo(() => {
		if (!shouldVirtualize) return null;

		const totalSize = virtualizer.getTotalSize();

		return {
			ref: containerRef,
			style: {
				height: horizontal ? '100%' : `${totalSize}px`,
				width: horizontal ? `${totalSize}px` : '100%',
				position: 'relative' as const,
			},
		};
	}, [shouldVirtualize, virtualizer, horizontal]);

	// Calcular tamaño total
	const totalSize = useMemo(() => {
		return shouldVirtualize ? virtualizer.getTotalSize() : 0;
	}, [virtualizer, shouldVirtualize]);

	return {
		isVirtualized: shouldVirtualize,
		virtualizer: shouldVirtualize ? virtualizer : null,
		virtualItems,
		containerProps,
		totalSize,
		lastVisibleIndex: shouldVirtualize ? lastVisibleIndex : undefined,
	};
}

/**
 * 🎯 Hook específico para virtualización en Grid con carga bajo demanda
 */
export function useGridVirtualization(
	items: unknown[],
	itemHeight: number,
	onLoadMore?: () => void,
	hasMore?: boolean,
	isLoadingMore?: boolean
) {
	return useVirtualization({
		items,
		estimateSize: itemHeight,
		measureElement: () => itemHeight, // Grid tiene altura fija
		onLoadMore,
		hasMore,
		isLoadingMore,
	});
}

/**
 * 📋 Hook específico para virtualización en List con carga bajo demanda
 */
export function useListVirtualization(
	items: unknown[],
	rowHeight = 60,
	onLoadMore?: () => void,
	hasMore?: boolean,
	isLoadingMore?: boolean
) {
	return useVirtualization({
		items,
		estimateSize: rowHeight,
		measureElement: () => rowHeight, // Lista tiene altura de fila fija
		onLoadMore,
		hasMore,
		isLoadingMore,
	});
}

/**
 * 🎴 Hook específico para virtualización en Cards con carga bajo demanda (altura variable)
 */
export function useCardsVirtualization(
	items: unknown[],
	estimatedHeight = 200,
	onLoadMore?: () => void,
	hasMore?: boolean,
	isLoadingMore?: boolean
) {
	return useVirtualization({
		items,
		estimateSize: estimatedHeight,
		// No proporcionamos measureElement para permitir altura dinámica
		onLoadMore,
		hasMore,
		isLoadingMore,
	});
}

/**
 * 🧱 Hook específico para virtualización en Masonry
 */
export function useMasonryVirtualization(items: unknown[], estimatedHeight = 240) {
	return useVirtualization({
		items,
		estimateSize: estimatedHeight,
		// Masonry requiere cálculo más complejo, se maneja en el componente
	});
}
