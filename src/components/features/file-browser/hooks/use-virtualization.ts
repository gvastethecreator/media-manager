/**
 * 🚀 Hook para virtualización con @tanstack/react-virtual
 *
 * Proporciona virtualización optimizada para listas grandes de elementos
 * con configuración dinámica desde ViewOptionsStore.
 */

import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
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
}

export function useVirtualization({
	items,
	estimateSize,
	forceEnabled = false,
	measureElement,
	horizontal = false,
}: UseVirtualizationOptions): VirtualizationResult {
	const containerRef = useRef<HTMLDivElement>(null);
	const { virtualization } = useViewOptionsStore();

	// Determinar si la virtualización debe estar activa
	const shouldVirtualize = useMemo(() => {
		return forceEnabled || (virtualization.enabled && items.length >= virtualization.threshold);
	}, [forceEnabled, virtualization.enabled, items.length, virtualization.threshold]);

	// SIEMPRE llamar useVirtualizer incondicionalmente para cumplir reglas de Hooks
	// Ajustamos los parámetros para desactivar cuando no sea necesario
	// Aplicar límite máximo de elementos para optimizar rendimiento
	const effectiveCount = shouldVirtualize ? Math.min(items.length, virtualization.maxItems || items.length) : 0;

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

	// Elementos virtuales a renderizar
	// Si hay más elementos que maxItems, solo renderizar los primeros maxItems para optimizar rendimiento
	const virtualItems = useMemo(() => {
		if (!shouldVirtualize) return [];
		const itemsToRender = virtualizer.getVirtualItems();
		// Asegurar que los índices no excedan el límite máximo
		const maxItems = virtualization.maxItems || items.length;
		return itemsToRender.filter((item) => item.index < Math.min(items.length, maxItems));
	}, [virtualizer, shouldVirtualize, items.length, virtualization.maxItems]);

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
	};
}

/**
 * 🎯 Hook específico para virtualización en Grid
 */
export function useGridVirtualization(items: unknown[], itemHeight: number) {
	return useVirtualization({
		items,
		estimateSize: itemHeight,
		measureElement: () => itemHeight, // Grid tiene altura fija
	});
}

/**
 * 📋 Hook específico para virtualización en List
 */
export function useListVirtualization(items: unknown[], rowHeight = 60) {
	return useVirtualization({
		items,
		estimateSize: rowHeight,
		measureElement: () => rowHeight, // Lista tiene altura de fila fija
	});
}

/**
 * 🎴 Hook específico para virtualización en Cards (altura variable)
 */
export function useCardsVirtualization(items: unknown[], estimatedHeight = 200) {
	return useVirtualization({
		items,
		estimateSize: estimatedHeight,
		// No proporcionamos measureElement para permitir altura dinámica
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
