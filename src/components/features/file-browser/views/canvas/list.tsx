import { useMemo, useState } from 'react';
import type { MediaItem } from '../../components/media-thumbnail';
import { useListVirtualization } from '../../hooks/use-virtualization';
import type { ClickModifiers } from '../../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { ListCanvas } from './list-canvas';

export interface ListProps {
	items: MediaItem[];
	rowHeight?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function List({
	items,
	rowHeight = CanvasRenderConfig.list.rowHeight,
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: ListProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// ⚡ Configurar virtualización para List
	const { isVirtualized, virtualItems, containerProps } = useListVirtualization(items, rowHeight);

	// Si no está virtualizado, renderizar modo tradicional
	if (!isVirtualized) {
		return (
			<div
				className="file-browser-canvas file-browser-list h-full w-full overflow-auto"
				data-testid="list-canvas-view"
				ref={setInternalScrollEl}
			>
				<div className="relative" data-testid="file-browser-scroll-area-viewport">
					<ListCanvas
						items={items}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
						rowHeight={rowHeight}
						scrollContainer={effectiveScrollContainer}
					/>
				</div>
			</div>
		);
	}

	// Renderizado virtualizado
	const virtualizedItems = useMemo(() => {
		return virtualItems.map((virtualItem) => items[virtualItem.index]);
	}, [virtualItems, items]);

	return (
		<div
			className="file-browser-canvas file-browser-list h-full w-full overflow-auto"
			data-testid="list-canvas-view"
			ref={setInternalScrollEl}
		>
			{/* Contenedor virtual */}
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
								<ListCanvas
									items={[item]}
									onItemClick={onItemClick}
									onItemDoubleClick={onItemDoubleClick}
									rowHeight={rowHeight}
									scrollContainer={effectiveScrollContainer}
								/>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
