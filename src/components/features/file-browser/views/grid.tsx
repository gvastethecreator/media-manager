import { GridCanvas } from './canvas/grid-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { useState } from 'react';

export interface GridProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Grid({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: GridProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-grid h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={setInternalScrollEl}
		>
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<GridCanvas itemSize={itemSize} items={items} onItemClick={onItemClick} onItemDoubleClick={onItemDoubleClick} />
			</div>
		</div>
	);
}
