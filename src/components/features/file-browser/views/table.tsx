import { TableCanvas } from './canvas/table-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { useState } from 'react';

export interface TableProps {
	items: MediaItem[];
	rowHeight?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Table({
	items,
	rowHeight = CanvasRenderConfig.table.rowHeight, // Table usa rowHeight como itemSize
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: TableProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;
	return (
		<div
			className="file-browser-canvas file-browser-table h-full w-full overflow-auto"
			data-testid="file-browser-container"
			ref={setInternalScrollEl}
		>
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<TableCanvas
					items={items}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick} // No hay contenedor externo, usa scroll interno
					rowHeight={rowHeight}
				/>
			</div>
		</div>
	);
}
