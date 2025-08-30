import { FileCanvas } from '../components/canvas/file-canvas';
import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';

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
		<div className="h-full w-full overflow-auto" data-testid="file-browser-container">
			<div className="relative w-full" data-testid="file-browser-scroll-area-viewport">
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
