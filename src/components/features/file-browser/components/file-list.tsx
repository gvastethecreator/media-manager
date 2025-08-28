import { useEffect, useState } from 'react';
import { MediaThumbnail } from './media-thumbnail';
import type { MediaItem } from './media-thumbnail';

// CONFIG local de la vista List (compacta y minimalista)
const CONFIG = {
	rowHeight: 90, // Altura máxima para acomodar thumbnails de 90px
	thumbnailSize: 90, // Thumbnail máximo 90x90px respetando aspect ratio
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
};

// Componente compacto para cada item de la lista
function CompactListItem({
	item,
	selected,
	onClick,
	onDoubleClick,
}: {
	item: MediaItem;
	selected: boolean;
	onClick?: (item: MediaItem) => void;
	onDoubleClick?: (item: MediaItem) => void;
}) {
	return (
		<button
			type="button"
			className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${selected ? 'bg-accent font-medium' : ''}`}
			style={{ maxHeight: '90px', height: `${CONFIG.rowHeight}px` }}
			data-entity-card
			data-entity-type={item.entityType}
			onClick={() => onClick?.(item)}
			onDoubleClick={() => onDoubleClick?.(item)}
		>
			{/* MediaThumbnail para todos los tipos */}
			<MediaThumbnail
				item={item}
				width={CONFIG.thumbnailSize}
				height={CONFIG.thumbnailSize}
				className="flex-shrink-0 rounded border"
				style={{
					objectFit: 'cover',
					maxWidth: `${CONFIG.thumbnailSize}px`,
					maxHeight: `${CONFIG.thumbnailSize}px`,
					width: `${CONFIG.thumbnailSize}px`,
					height: `${CONFIG.thumbnailSize}px`,
				}}
			/>

			{/* Nombre del archivo truncado */}
			<span className="flex-1 truncate font-medium">{item.name}</span>

			{/* Información adicional opcional */}
			{item.width && item.height && (
				<span className="font-mono text-muted-foreground text-xs">
					{item.width}×{item.height}
				</span>
			)}
		</button>
	);
}

interface FileListProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	// Permite usar un contenedor de scroll externo (react-virtuoso: customScrollParent)
	scrollParent?: HTMLElement | null;
	// Key para forzar remount del componente Virtuoso
	virtuosoKey?: string;
}

export function FileList({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	scrollParent,
	virtuosoKey,
}: FileListProps) {
	const [VirtuosoComp, setVirtuosoComp] = useState<any>(null);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).Virtuoso || null;
				setVirtuosoComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoComp) {
		return (
			<div style={{ height: scrollParent ? 'auto' : '100%' }} data-testid="listview-container">
				<VirtuosoComp
					key={virtuosoKey} // Key para forzar remount
					data={items}
					computeItemKey={(index: number, item: MediaItem) => item.id}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(50, items.length)}
					itemContent={(index: number, item: MediaItem) => (
						<div data-testid={`list-row-${index}`}>
							<CompactListItem
								key={item.id}
								item={item}
								selected={selectedIds.includes(item.id)}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
							/>
						</div>
					)}
					style={{ height: scrollParent ? 'auto' : '100%' }}
					useWindowScroll={false}
					fixedItemSize={CONFIG.rowHeight}
					// Usar contenedor de scroll externo cuando se proporciona
					customScrollParent={scrollParent ?? undefined}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="flex flex-col gap-1 p-2" data-testid="listview-container">
			{items.map((item, index) => (
				<div key={item.id} data-testid={`list-row-${index}`}>
					<CompactListItem
						item={item}
						selected={selectedIds.includes(item.id)}
						onClick={onItemClick}
						onDoubleClick={onItemDoubleClick}
					/>
				</div>
			))}
		</div>
	);
}
