import { useMemo, useState } from 'react';
import type { MediaItem } from '../../components/media-thumbnail';
import { useMasonryVirtualization } from '../../hooks/use-virtualization';
import type { ClickModifiers } from '../../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { MasonryCanvas } from './masonry-canvas';

export interface MasonryProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Masonry({
	items,
	itemSize = CanvasRenderConfig.masonry.columnWidth, // Masonry usa columnWidth como itemSize base
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: MasonryProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// ⚡ Configurar virtualización para Masonry
	const { isVirtualized, virtualItems, containerProps } = useMasonryVirtualization(items, itemSize);

	// Si no está virtualizado, renderizar modo tradicional
	if (!isVirtualized) {
		return (
			<div
				className="file-browser-canvas file-browser-masonry h-full w-full overflow-auto"
				data-testid="masonry-view"
				ref={setInternalScrollEl}
			>
				<div className="relative" data-testid="file-browser-scroll-area-viewport">
					<MasonryCanvas
						columnWidth={itemSize}
						items={items}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
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
			className="file-browser-canvas file-browser-masonry h-full w-full overflow-auto"
			data-testid="masonry-view"
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
								<MasonryCanvas
									columnWidth={itemSize}
									items={[item]}
									onItemClick={onItemClick}
									onItemDoubleClick={onItemDoubleClick}
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
