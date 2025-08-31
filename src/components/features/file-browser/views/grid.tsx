import { GridCanvas } from '../components/canvas/grid-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';

export interface GridProps {
	items: MediaItem[];
	itemSize?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Grid({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize,
	onItemClick,
	onItemDoubleClick,
}: GridProps) {
	return (
		<div className="h-full w-full overflow-auto" data-testid="file-browser-container">
			<div className="relative" data-testid="file-browser-scroll-area-viewport">
				<GridCanvas
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
