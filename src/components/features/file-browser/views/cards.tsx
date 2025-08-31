import { CardsCanvas } from '../components/canvas/cards-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';

export interface CardsProps {
	items: MediaItem[];
	itemSize?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Cards({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize, // Cards usa la misma configuración que grid
	onItemClick,
	onItemDoubleClick,
}: CardsProps) {
	return (
		<div className="h-full w-full overflow-auto" data-testid="file-browser-container">
			<div className="h-full min-h-0">
				<div className="relative" data-testid="file-browser-scroll-area-viewport">
					<CardsCanvas
						itemSize={itemSize}
						items={items}
						onItemClick={onItemClick} // No hay contenedor externo, usa scroll interno
						onItemDoubleClick={onItemDoubleClick}
						scrollContainer={null}
					/>
				</div>
			</div>
		</div>
	);
}
