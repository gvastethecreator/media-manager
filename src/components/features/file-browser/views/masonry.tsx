import { FileCanvas } from '../components/canvas/file-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';

export interface MasonryProps {
	items: MediaItem[];
	itemSize?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Masonry({
	items,
	itemSize = CanvasRenderConfig.masonry.columnWidth, // Masonry usa columnWidth como itemSize base
	onItemClick,
	onItemDoubleClick,
}: MasonryProps) {
	return (
		<div className="h-full w-full overflow-auto" data-testid="file-browser-container">
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<FileCanvas
					itemSize={itemSize}
					items={items}
					onItemClick={onItemClick} // No hay contenedor externo, usa scroll interno
					onItemDoubleClick={onItemDoubleClick}
					scrollContainer={null}
				/>
			</div>
		</div>
	);
}
