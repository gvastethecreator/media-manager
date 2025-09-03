import type { MediaItem } from '../../components/media-thumbnail';
import type { ClickModifiers } from '../../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { List } from './list';

export interface FileCanvasListGroupedProps {
	groups: Array<{ key: string; items: MediaItem[]; displayName: string }>;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileCanvasListGrouped({
	groups,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: FileCanvasListGroupedProps) {
	// Render simple: encabezados DOM, contenido por grupo con FileCanvasList independiente
	const headerH = CanvasRenderConfig.group.headerHeight;
	return (
		<div className="file-browser-canvas file-browser-list h-full overflow-auto">
			<div className="flex flex-col gap-2">
				{groups.map((g) => (
					<div className="flex flex-col" key={g.key}>
						<h2
							style={{
								position: 'sticky',
								top: 0,
								zIndex: 10,
								padding: '0.5rem',
								fontSize: '0.75rem',
								fontWeight: 600,
								textTransform: 'uppercase',
								borderBottom: '1px solid hsl(var(--border) / 0.5)',
								backgroundColor: 'color-mix(in oklab, var(--background) 80%, transparent)',
								backdropFilter: 'saturate(180%) blur(4px)',
								color: 'hsl(var(--muted-foreground))',
								height: headerH,
							}}
						>
							{g.displayName}
						</h2>
						<List
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
