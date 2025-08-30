import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { Grid } from './grid';
import { CanvasRenderConfig } from './canvas-config';

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
		<div className="h-full overflow-auto">
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<div
							className="sticky top-0 z-10 bg-background/80 p-2 font-semibold text-muted-foreground text-xs uppercase backdrop-blur supports-[backdrop-filter]:bg-background/60"
							style={{ height: headerH }}
						>
							{g.displayName}
						</div>
						<div className="relative">
							<Grid
								items={g.items}
								itemSize={itemSize}
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
