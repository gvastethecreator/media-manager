import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { Masonry } from './masonry';

export interface FileCanvasMasonryGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileCanvasMasonryGrouped({
	groups,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: FileCanvasMasonryGroupedProps) {
	const headerH = CanvasRenderConfig.group.headerHeight;
	return (
		<div className="file-browser-canvas file-browser-masonry h-full overflow-auto">
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<h2
							className="sticky top-0 z-10 border-b border-border/50 bg-background/80 p-2 text-xs font-semibold uppercase text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60"
							style={{ height: headerH }}
						>
							{g.displayName}
						</h2>
						<Masonry items={g.items} onItemClick={onItemClick} onItemDoubleClick={onItemDoubleClick} />
					</div>
				))}
			</div>
		</div>
	);
}
