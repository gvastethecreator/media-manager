import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { FileCanvas } from '../components/canvas/file-canvas';

export interface SingleProps {
	items: MediaItem[];
	itemSize?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Single({
	items,
	itemSize = 400, // Para single view usamos un tamaño grande por defecto
	onItemClick,
	onItemDoubleClick,
}: SingleProps) {
	return (
		<div className="h-full w-full" data-testid="file-browser-container">
			<div className="h-full min-h-0 overflow-hidden">
				<div className="relative h-full w-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
					<FileCanvas
						items={items}
						itemSize={itemSize}
						scrollContainer={null} // No hay contenedor externo, usa scroll interno
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
					/>
				</div>
			</div>
		</div>
	);
}
