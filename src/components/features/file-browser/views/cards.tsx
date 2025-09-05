import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { CardsCanvas } from './canvas/cards-canvas';

export interface CardsProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	page?: number; // 0-based
	pageSize?: number; // default 300
}

export function Cards({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize, // Cards usa la misma configuración que grid
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
	page,
	pageSize = 300,
}: CardsProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// Paginación controlada sólo si "page" está definido; si no, renderizamos todos los items
	const pagedItems = useMemo(() => {
		if (typeof page === 'number') {
			const start = page * pageSize;
			return items.slice(start, start + pageSize);
		}
		return items;
	}, [items, page, pageSize]);

	// Al cambiar de página (si existe), ir al tope del contenedor de scroll
	useEffect(() => {
		if (typeof page !== 'number') return;
		const el = containerRef.current;
		if (el) el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
	}, [page]);
	return (
		<div
			className="file-browser-canvas file-browser-cards h-full w-full overflow-auto"
			data-testid="cards-view"
			ref={(el) => {
				setInternalScrollEl(el);
				containerRef.current = el;
			}}
		>
			<div className="h-full min-h-0">
				<div className="relative" data-testid="file-browser-scroll-area-viewport">
					<CardsCanvas
						itemSize={itemSize}
						items={pagedItems}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
						scrollContainer={effectiveScrollContainer}
					/>
				</div>
			</div>
		</div>
	);
}
