import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas/canvas-config';
import { Table } from './table';

export interface FileCanvasTableGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	onContainerReady?: (el: HTMLDivElement | null) => void;
}

export function FileCanvasTableGrouped({
	groups,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
	onContainerReady,
}: FileCanvasTableGroupedProps) {
	const headerH = CanvasRenderConfig.group.headerHeight;
	return (
		<div className="file-browser-canvas file-browser-table h-full overflow-auto" ref={onContainerReady}>
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<h2
							className="sticky top-0 z-10 border-border/50 border-b bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60"
							style={{ height: headerH }}
						>
							{g.displayName}
						</h2>
						<Table
							items={g.items}
							onItemClick={onItemClick}
							onItemDoubleClick={onItemDoubleClick}
							scrollContainer={scrollContainer}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
