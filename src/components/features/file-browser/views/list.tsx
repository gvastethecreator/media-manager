import { ListCanvas } from './canvas/list-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { useState } from 'react';

export interface ListProps {
	items: MediaItem[];
	rowHeight?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function List({
	items,
	rowHeight = CanvasRenderConfig.list.rowHeight,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: ListProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-list h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={setInternalScrollEl}
		>
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<ListCanvas
					items={items}
					rowHeight={rowHeight}
					scrollContainer={effectiveScrollContainer}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
				/>
			</div>
		</div>
	);
}
