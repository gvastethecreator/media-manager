import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { FileCanvas } from '../components/canvas/file-canvas';
import { CanvasRenderConfig } from './canvas-config';

export interface ListProps {
	items: MediaItem[];
	rowHeight?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function List({
	items,
	rowHeight = CanvasRenderConfig.list.rowHeight,
	onItemClick,
	onItemDoubleClick,
}: ListProps) {
	return (
		<div className="h-full w-full" data-testid="file-browser-container">
			<div className="h-full min-h-0 overflow-hidden">
				<div className="relative h-full w-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
					<FileCanvas
						items={items}
						itemSize={rowHeight} // Para list view, usamos rowHeight como itemSize
						scrollContainer={null} // No hay contenedor externo, usa scroll interno
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
					/>
				</div>
			</div>
		</div>
	);
}
