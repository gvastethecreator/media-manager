import { CardsCanvas } from './canvas/cards-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { useState } from 'react';

export interface CardsProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Cards({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize, // Cards usa la misma configuración que grid
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: CardsProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-cards h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={setInternalScrollEl}
		>
			<div className="h-full min-h-0">
				<div className="relative" data-testid="file-browser-scroll-area-viewport">
					<CardsCanvas
						itemSize={itemSize}
						items={items}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
					/>
				</div>
			</div>
		</div>
	);
}
