import { useMemo, useState } from 'react';
import type { MediaItem } from '../../components/media-thumbnail';
import { useGridVirtualization } from '../../hooks/use-virtualization';
import type { ClickModifiers } from '../../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { GridCanvas } from './grid-canvas';

export interface GridProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Grid({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: GridProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// ⚡ Configurar virtualización para Grid
	const { isVirtualized, virtualItems, containerProps, totalSize } = useGridVirtualization(items, itemSize);

	// SIEMPRE renderizar este useMemo para evitar problemas de hooks
	const virtualizedItems = useMemo(() => {
		return virtualItems.map((virtualItem) => items[virtualItem.index]);
	}, [virtualItems, items]);

	// Si no está virtualizado, renderizar modo tradicional
	if (!isVirtualized) {
		return (
			<div
				className="file-browser-canvas file-browser-grid h-full w-full overflow-auto"
				data-testid="grid-canvas-view"
				ref={setInternalScrollEl}
			>
				<div className="relative min-h-[160px]" data-testid="file-browser-scroll-area-viewport">
					<GridCanvas
						itemSize={itemSize}
						items={items}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
					/>
				</div>
			</div>
		);
	}

	// Renderizado virtualizado

	return (
		<div
			className="file-browser-canvas file-browser-grid h-full w-full overflow-auto"
			data-testid="grid-canvas-view"
			ref={setInternalScrollEl}
		>
			{/* Contenedor virtual con altura total calculada */}
			{containerProps && (
				<div {...containerProps} data-testid="file-browser-scroll-area-viewport">
					{/* Elementos virtuales */}
					{virtualItems.map((virtualItem) => {
						const item = items[virtualItem.index];
						if (!item) return null;

						return (
							<div
								data-index={virtualItem.index}
								key={virtualItem.key}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
							>
								<GridCanvas
									itemSize={itemSize}
									items={[item]}
									onItemClick={onItemClick}
									onItemDoubleClick={onItemDoubleClick}
								/>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
