import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { FileCanvas } from '../components/canvas/file-canvas';
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
        <div className="h-full w-full" data-testid="file-browser-container">
            <div className="h-full min-h-0 overflow-hidden">
                <div className="relative h-full w-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
                    <FileCanvas
                        items={items}
                        itemSize={rowHeight}
                        scrollContainer={null} // No hay contenedor externo, usa scroll interno
                        onItemClick={onItemClick}
                        onItemDoubleClick={onItemDoubleClick}
                    />
                </div>
            </div>
        </div>
    );
}
