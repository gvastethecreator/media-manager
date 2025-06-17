'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useCallback, useMemo, useRef } from 'react';
import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import { type BaseGridConfig, GRID_CONFIG, getMetadata } from '../config/grid-config';

/**
 * Props para el hook useGridVirtualizer
 */
interface UseGridVirtualizerProps {
	items: FileItem[];
	parentRef: RefObject<HTMLDivElement | null>; // 🔧 CORREGIDO: Permitir null
	viewMode: ViewMode;
	containerWidth: number;
}

/**
 * Resultado del hook useGridVirtualizer
 */
interface VirtualizerResult {
	columns: number;
	itemSize: number;
	rowHeight: number;
	virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
	calculateMasonryHeight: (item: any, baseWidth: number) => number;
}

/**
 * Cache simple para las dimensiones calculadas de los elementos
 * Evita recalcular las alturas en cada renderizado de masonry
 */
const dimensionCache = new Map<string, { height: number; width: number }>();

/**
 * Hook para implementar virtualización en el grid de archivos
 *
 * Este hook proporciona:
 * - Cálculo optimizado de dimensiones del grid según el modo de vista
 * - Configuración del virtualizador para renderizado eficiente
 * - Cálculo de altura para vista masonry basado en proporciones de imagen
 * - Adaptación a cambios de tamaño del contenedor
 *
 * @param items - Lista de archivos a virtualizar
 * @param parentRef - Referencia al elemento contenedor
 * @param viewMode - Modo de visualización actual
 * @param containerWidth - Ancho del contenedor
 * @returns Objeto con dimensiones calculadas y virtualizador configurado
 */
export function useGridVirtualizer({
	items,
	parentRef,
	viewMode,
	containerWidth,
}: UseGridVirtualizerProps): VirtualizerResult {
	// Referencia al último modo de visualización para detección de cambios
	const lastViewModeRef = useRef<ViewMode>(viewMode);

	// Función para calcular columnas - memoizada para evitar recreaciones
	const calculateColumns = useCallback((configObj: BaseGridConfig, availableWidth: number, gap: number) => {
		const { minColumns, maxColumns, itemBaseWidth, padding } = configObj;
		const totalPadding = padding * 2;
		const availableWidthWithGap = availableWidth - totalPadding;
		const calculatedCols = Math.floor(availableWidthWithGap / (itemBaseWidth + gap));
		return Math.max(minColumns, Math.min(maxColumns, calculatedCols));
	}, []);

	// Función para calcular tamaño de items - memoizada
	const calculateItemSize = useCallback(
		(cols: number, configObj: BaseGridConfig, availableWidth: number, gap: number) => {
			const totalPadding = configObj.padding * 2;
			const totalGapWidth = gap * (cols - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const itemWidth = Math.floor((availableWidthWithGap - totalGapWidth) / cols);

			// El ancho del item ya está correctamente calculado
			return itemWidth;
		},
		[]
	);

	// Dimensiones del grid memoizadas y optimizadas
	const { columns, itemSize, rowHeight } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth - 48;
		const currentGap = GRID_CONFIG.gap[viewMode];

		let cols: number;
		let size: number;
		let height: number;

		switch (viewMode) {
			case 'masonry': {
				const config = GRID_CONFIG.masonry;
				cols = calculateColumns(config, availableWidth, currentGap);
				size = calculateItemSize(cols, config, availableWidth, currentGap);
				height = 0;
				break;
			}
			case 'cards': {
				const config = GRID_CONFIG.cards;
				cols = calculateColumns(config, availableWidth, currentGap);
				size = calculateItemSize(cols, config, availableWidth, currentGap);
				height = config.rowHeight;
				break;
			}
			case 'list': {
				const config = GRID_CONFIG.list;
				cols = 1;
				size = availableWidth - currentGap * 2 - config.padding * 2;
				height = config.height;
				break;
			}
			default: {
				const config = GRID_CONFIG.grid;
				cols = calculateColumns(config, availableWidth, currentGap);
				size = calculateItemSize(cols, config, availableWidth, currentGap);
				height = size;
			}
		}

		// Si el modo de visualización cambió, limpiar el cache de dimensiones
		if (lastViewModeRef.current !== viewMode) {
			dimensionCache.clear();
			lastViewModeRef.current = viewMode;
		}

		return { columns: cols, itemSize: size, rowHeight: height };
	}, [containerWidth, viewMode, calculateColumns, calculateItemSize]);

	// Optimizar el cálculo de altura para masonry con cache
	const calculateMasonryHeight = useCallback((item: any, baseWidth: number) => {
		// Verificar que el item sea válido
		if (!item || typeof item !== 'object' || !item.id) {
			return GRID_CONFIG.masonry.minHeight;
		}

		// Verificar si ya tenemos las dimensiones en cache
		if (dimensionCache.has(item.id)) {
			const cached = dimensionCache.get(item.id);
			if (cached && cached.width === baseWidth) {
				return cached.height;
			}
		}

		const metadata = getMetadata(item.metadata);
		const config = GRID_CONFIG.masonry;

		if (!metadata?.dimensions) {
			const defaultHeight = config.minHeight;
			dimensionCache.set(item.id, { height: defaultHeight, width: baseWidth });
			return defaultHeight;
		}

		const aspectRatio = metadata.dimensions.width / metadata.dimensions.height;
		const calculatedHeight = Math.round(baseWidth / aspectRatio);
		const finalHeight = Math.max(config.minHeight, Math.min(calculatedHeight, config.maxHeight));

		// Guardar el resultado en cache para evitar recálculos
		dimensionCache.set(item.id, { height: finalHeight, width: baseWidth });

		return finalHeight;
	}, []);

	// Cache para resultados de estimateSize
	const estimateSizeCache = useRef<Map<number, number>>(new Map());

	// Función de estimación de tamaño optimizada con cache
	const estimateSize = useCallback(
		(index: number) => {
			// Verificar si el tamaño ya está en cache
			if (estimateSizeCache.current.has(index)) {
				return estimateSizeCache.current.get(index) || 0;
			}

			const item = items[index];
			if (!item) {
				const defaultSize = rowHeight + GRID_CONFIG.gap[viewMode];
				estimateSizeCache.current.set(index, defaultSize);
				return defaultSize;
			}

			let size: number;
			switch (viewMode) {
				case 'masonry': {
					const height = calculateMasonryHeight(item, itemSize);
					size = height + GRID_CONFIG.masonry.rowGap;
					break;
				}
				case 'cards':
					size = GRID_CONFIG.cards.rowHeight + GRID_CONFIG.gap[viewMode];
					break;
				case 'list':
					size = GRID_CONFIG.list.height + GRID_CONFIG.gap[viewMode];
					break;
				default:
					size = itemSize + GRID_CONFIG.gap[viewMode];
			}

			// Guardar el resultado en cache
			estimateSizeCache.current.set(index, size);
			return size;
		},
		[items, viewMode, itemSize, rowHeight, calculateMasonryHeight]
	);

	// Limpiar cache cuando cambian las dependencias clave
	if (lastViewModeRef.current !== viewMode) {
		estimateSizeCache.current.clear();
	}

	// Actualizar virtualizer con soporte mejorado para masonry
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan: GRID_CONFIG.overscan,
		horizontal: false,
		lanes: viewMode === 'list' ? 1 : columns,
		gap: viewMode === 'masonry' ? GRID_CONFIG.masonry.columnGap : GRID_CONFIG.gap[viewMode],
		scrollPaddingStart: GRID_CONFIG.gap[viewMode],
		scrollPaddingEnd: GRID_CONFIG.gap[viewMode],
	});

	return {
		columns,
		itemSize,
		rowHeight,
		virtualizer,
		calculateMasonryHeight,
	};
}
