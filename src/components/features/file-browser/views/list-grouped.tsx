import type { MediaItem } from '../components/media-thumbnail';
import type { ClickModifiers } from '../types/file-browser.types';
import { List } from './list';
import { CanvasRenderConfig } from './canvas-config';

export interface FileCanvasListGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileCanvasListGrouped({ groups, onItemClick, onItemDoubleClick }: FileCanvasListGroupedProps) {
	// Render simple: encabezados DOM, contenido por grupo con FileCanvasList independiente
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
						<List
							items={g.items}
							onItemClick={onItemClick}
							onItemDoubleClick={onItemDoubleClick}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
