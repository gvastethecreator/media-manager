/**
 * Compat legacy: navegación por teclado para tests/unit.
 *
 * Nota:
 * - El file-browser "nuevo" usa otro hook con responsabilidades distintas.
 * - Este módulo mantiene el contrato mínimo esperado por tests (getNextIndex).
 */

import { useCallback, useMemo } from 'react';

export type LegacyViewMode = 'grid' | 'list' | 'masonry' | 'table' | 'cards';
export type LegacyNavDirection = 'up' | 'down' | 'left' | 'right';

export interface LegacyKeyboardNavigationOptions {
	items: Array<{ id: string }>; // el test sólo necesita length
	viewMode: LegacyViewMode;
	containerRef: React.RefObject<HTMLElement | null>;
	itemSize?: number;
	columns?: number;
}

function estimateColumns(container: HTMLElement | null, itemSize: number): number {
	if (!container) return 4;
	const containerWidth = container.clientWidth;
	const gap = 8;
	return Math.max(1, Math.floor((containerWidth + gap) / (itemSize + gap)));
}

export function useKeyboardNavigation({
	items,
	viewMode,
	containerRef,
	itemSize = 150,
	columns,
}: LegacyKeyboardNavigationOptions) {
	const cols = useMemo(() => {
		if (columns) return columns;
		if (viewMode === 'list' || viewMode === 'table') return 1;
		return estimateColumns(containerRef.current, itemSize);
	}, [columns, viewMode, containerRef, itemSize]);

	const getNextIndex = useCallback(
		(currentIndex: number, direction: LegacyNavDirection) => {
			if (items.length === 0) return 0;

			const clamp = (idx: number) => Math.min(Math.max(idx, 0), items.length - 1);

			switch (direction) {
				case 'up':
					return clamp(viewMode === 'list' || viewMode === 'table' ? currentIndex - 1 : currentIndex - cols);
				case 'down':
					return clamp(viewMode === 'list' || viewMode === 'table' ? currentIndex + 1 : currentIndex + cols);
				case 'left':
					return clamp(currentIndex - 1);
				case 'right':
					return clamp(currentIndex + 1);
				default:
					return clamp(currentIndex);
			}
		},
		[items.length, viewMode, cols]
	);

	return {
		getNextIndex,
	};
}
