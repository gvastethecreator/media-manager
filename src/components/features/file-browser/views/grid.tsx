import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { GridCanvas } from './canvas/grid-canvas';

export interface GridProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	page?: number; // 0-based, opcional
	pageSize?: number; // default 300
}

export function Grid({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
	page,
	pageSize = 300,
}: GridProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Paginación controlada solo si se provee "page"; si no, renderizar todo el conjunto
	const pagedItems = useMemo(() => {
		if (typeof page === 'number') {
			const start = page * pageSize;
			return items.slice(start, start + pageSize);
		}
		return items;
	}, [items, page, pageSize]);

	// Al cambiar de página (sólo si hay paginación), ir al tope del contenedor de scroll
	useEffect(() => {
		if (typeof page !== 'number') return;
		const el = containerRef.current;
		if (el) el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
	}, [page]);
	return (
		<div
			className="file-browser-canvas file-browser-grid h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={(el) => {
				setInternalScrollEl(el);
				containerRef.current = el;
			}}
		>
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<GridCanvas
					itemSize={itemSize}
					items={pagedItems}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
				/>
			</div>
		</div>
	);
}
