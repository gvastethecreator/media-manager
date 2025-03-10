'use client';

import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useCallback, useMemo } from 'react';
import { type BaseGridConfig, GRID_CONFIG, getMetadata } from '../config/grid-config';

interface UseGridVirtualizerProps {
	items: FileItem[];
	parentRef: RefObject<HTMLDivElement>;
	viewMode: ViewMode;
	containerWidth: number;
}

interface VirtualizerResult {
	columns: number;
	itemSize: number;
	rowHeight: number;
	virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
	calculateMasonryHeight: (item: FileItem, baseWidth: number) => number;
}

export function useGridVirtualizer({
	items,
	parentRef,
	viewMode,
	containerWidth,
}: UseGridVirtualizerProps): VirtualizerResult {
	// Dimensiones del grid memoizadas y optimizadas
	const { columns, itemSize, rowHeight } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth - 48;
		const currentGap = GRID_CONFIG.gap[viewMode];

		// Función para calcular el número de columnas basado en la configuración
		const calculateColumns = (configObj: BaseGridConfig) => {
			const { minColumns, maxColumns, itemBaseWidth, padding } = configObj;
			const totalPadding = padding * 2;
			// Ignoramos cualquier cálculo de gap y nos enfocamos en el espacio disponible
			const availableWidthWithGap = availableWidth - totalPadding;
			const calculatedCols = Math.floor(availableWidthWithGap / (itemBaseWidth + currentGap));
			return Math.max(minColumns, Math.min(maxColumns, calculatedCols));
		};

		const calculateItemSize = (cols: number, configObj: BaseGridConfig) => {
			const totalPadding = configObj.padding * 2;
			const totalGapWidth = currentGap * (cols - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const itemWidth = Math.floor((availableWidthWithGap - totalGapWidth) / cols);

			// Asegurar que el tamaño no exceda el máximo para el modo
			return Math.min(itemWidth, viewMode === 'masonry' ? configObj.itemBaseWidth * 1.5 : itemWidth);
		};

		let cols: number;
		let size: number;
		let height: number;

		switch (viewMode) {
			case 'masonry': {
				const config = GRID_CONFIG.masonry;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = 0;
				break;
			}
			case 'cards': {
				const config = GRID_CONFIG.cards;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
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
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = size;
			}
		}

		return { columns: cols, itemSize: size, rowHeight: height };
	}, [containerWidth, viewMode]);

	// Optimizar el cálculo de altura para masonry
	const calculateMasonryHeight = useCallback((item: FileItem, baseWidth: number) => {
		const metadata = getMetadata(item.metadata);
		const config = GRID_CONFIG.masonry;

		if (!metadata?.dimensions) {
			return config.minHeight;
		}

		const aspectRatio = metadata.dimensions.width / metadata.dimensions.height;
		const calculatedHeight = Math.round(baseWidth / aspectRatio);

		return Math.max(config.minHeight, Math.min(calculatedHeight, config.maxHeight));
	}, []);

	// Actualizar virtualizer con soporte mejorado para masonry
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: useCallback(
			(index: number) => {
				const item = items[index];
				if (!item) {
					return rowHeight + GRID_CONFIG.gap[viewMode];
				}

				switch (viewMode) {
					case 'masonry': {
						const height = calculateMasonryHeight(item, itemSize);
						return height + GRID_CONFIG.masonry.rowGap;
					}
					case 'cards':
						return GRID_CONFIG.cards.rowHeight + GRID_CONFIG.gap[viewMode];
					case 'list':
						return GRID_CONFIG.list.height + GRID_CONFIG.gap[viewMode];
					default:
						return itemSize + GRID_CONFIG.gap[viewMode];
				}
			},
			[items, viewMode, itemSize, rowHeight, calculateMasonryHeight]
		),
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
