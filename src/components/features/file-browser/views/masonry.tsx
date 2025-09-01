import { useState } from 'react';
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
}

export function Masonry({
	items,
	itemSize = CanvasRenderConfig.masonry.columnWidth, // Masonry usa columnWidth como itemSize base
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: MasonryProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-masonry h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={setInternalScrollEl}
		>
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<MasonryCanvas
					columnWidth={itemSize}
					items={items}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
					scrollContainer={effectiveScrollContainer}
				/>
			</div>
		</div>
	);
}
