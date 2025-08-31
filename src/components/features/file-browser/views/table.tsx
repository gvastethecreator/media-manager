import { TableCanvas } from '../components/canvas/table-canvas';
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
				<TableCanvas
					items={items}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick} // No hay contenedor externo, usa scroll interno
					rowHeight={rowHeight}
					scrollContainer={null}
				/>
			</div>
		</div>
	);
}
