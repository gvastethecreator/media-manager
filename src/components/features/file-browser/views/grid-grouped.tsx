import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { Grid } from './grid';

export interface FileCanvasGridGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	itemSize?: number;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileCanvasGridGrouped({
	groups,
	itemSize = CanvasRenderConfig.grid.itemSize,
	onItemClick,
	onItemDoubleClick,
}: FileCanvasGridGroupedProps) {
	const headerH = CanvasRenderConfig.group.headerHeight;
	return (
		<div className="h-full w-full overflow-auto">
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<div className="sticky top-0 z-10 h-9 bg-background/80 px-2 py-1 font-semibold text-lg text-muted-foreground uppercase shadow-xs backdrop-blur supports-[backdrop-filter]:bg-background/60">
							{g.displayName}
						</div>
						<div className="relative">
							<Grid
								itemSize={itemSize}
								items={g.items}
								onItemClick={onItemClick}
								onItemDoubleClick={onItemDoubleClick}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
