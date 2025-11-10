import { useState } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { ListCanvas } from './canvas/list-canvas';

export interface ListProps {
	items: MediaItem[];
	rowHeight?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	/**
	 * TestId opcional para el contenedor. Por defecto 'listview-container'.
	 * Permite desactivar o personalizar el testid en usos agrupados para evitar duplicados.
	 */
	testId?: string | null;
	onContainerReady?: (el: HTMLDivElement | null) => void;
}

export function List({
	items,
	rowHeight = CanvasRenderConfig.list.rowHeight,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
	testId = 'listview-container',
	onContainerReady,
}: ListProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-list h-full w-full overflow-auto"
			{...(testId ? { 'data-testid': testId } : {})}
			ref={(el) => {
				setInternalScrollEl(el);
				onContainerReady?.(el);
			}}
		>
			<div className="relative min-h-[160px]" data-testid="file-browser-scroll-area-viewport">
				<ListCanvas
					items={items}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
					rowHeight={rowHeight}
					scrollContainer={effectiveScrollContainer}
				/>
			</div>
		</div>
	);
}
