import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { MasonryCanvas } from './canvas/masonry-canvas';

export interface MasonryProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	page?: number; // 0-based
	pageSize?: number; // default 300
	onContainerReady?: (el: HTMLDivElement | null) => void;
}

export function Masonry({
	items,
	itemSize = CanvasRenderConfig.masonry.columnWidth, // Masonry usa columnWidth como itemSize base
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
	page,
	pageSize = 300,
	onContainerReady,
}: MasonryProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// Paginación sólo si "page" está definido; si no, renderizar todos los items
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
			className="file-browser-canvas file-browser-masonry h-full w-full overflow-auto"
			data-testid="masonry-view"
			ref={(el) => {
				setInternalScrollEl(el);
				containerRef.current = el;
				onContainerReady?.(el);
			}}
		>
			<div className="relative min-h-[160px]" data-testid="file-browser-scroll-area-viewport">
				<MasonryCanvas
					columnWidth={itemSize}
					items={pagedItems}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
					scrollContainer={effectiveScrollContainer}
				/>
			</div>
		</div>
	);
}
