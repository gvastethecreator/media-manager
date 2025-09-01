import type { MediaItem } from '../../components/media-thumbnail';
import type { ClickModifiers } from '../../types/file-browser.types';
import { FileCanvas as BaseFileCanvas } from './file-canvas';

export interface GridCanvasProps {
	items: MediaItem[];
	itemSize?: number;
	gap?: number;
	overscanRows?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

// Reexport del FileCanvas original como GridCanvas para aislar usos por vista
export function GridCanvas(props: GridCanvasProps) {
	return (<BaseFileCanvas data-testid="grid-canvas" {...props} />) as any;
}
