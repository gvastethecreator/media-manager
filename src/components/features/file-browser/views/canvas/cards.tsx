import { useMemo, useState } from 'react';
import type { MediaItem } from '../../components/media-thumbnail';
import { useCardsVirtualization } from '../../hooks/use-virtualization';
import type { ClickModifiers } from '../../types/file-browser.types';
import { CanvasRenderConfig } from './canvas-config';
import { CardsCanvas } from './cards-canvas';

export interface CardsProps {
	items: MediaItem[];
	itemSize?: number;
	scrollContainer?: HTMLElement | null;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function Cards({
	items,
	itemSize = CanvasRenderConfig.grid.itemSize, // Cards usa la misma configuración que grid
	scrollContainer = null,
	onItemClick,
	onItemDoubleClick,
}: CardsProps) {
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);
	const effectiveScrollContainer = scrollContainer ?? internalScrollEl;

	// ⚡ Configurar virtualización para Cards
	const { isVirtualized, virtualItems, containerProps } = useCardsVirtualization(items, itemSize);

	// Si no está virtualizado, renderizar modo tradicional
	if (!isVirtualized) {
		return (
			<div
				className="file-browser-canvas file-browser-cards h-full w-full overflow-auto"
				data-testid="cards-view"
				ref={setInternalScrollEl}
			>
				<div className="h-full min-h-0">
					<div className="relative" data-testid="file-browser-scroll-area-viewport">
						<CardsCanvas
							itemSize={itemSize}
							items={items}
							onItemClick={onItemClick}
							onItemDoubleClick={onItemDoubleClick}
							scrollContainer={effectiveScrollContainer}
						/>
					</div>
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
			className="file-browser-canvas file-browser-cards h-full w-full overflow-auto"
			data-testid="cards-view"
			ref={setInternalScrollEl}
		>
			<div className="h-full min-h-0">
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
									<CardsCanvas
										itemSize={itemSize}
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
		</div>
	);
}
