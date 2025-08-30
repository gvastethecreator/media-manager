import { FileCanvas } from '../components/canvas/file-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';

export interface TableProps {
	items: MediaItem[];
	rowHeight?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Table({
	items,
	rowHeight = CanvasRenderConfig.table.rowHeight, // Table usa rowHeight como itemSize
	onItemClick,
	onItemDoubleClick,
}: TableProps) {
	return (
		<div className="h-full w-full overflow-auto" data-testid="file-browser-container">
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<FileCanvas
					itemSize={rowHeight}
					items={items}
					onItemClick={onItemClick} // No hay contenedor externo, usa scroll interno
					onItemDoubleClick={onItemDoubleClick}
					scrollContainer={null}
				/>
			</div>
		</div>
	);
}
