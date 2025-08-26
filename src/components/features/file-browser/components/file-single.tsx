import { useEffect, useState } from 'react';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

// CONFIG local de la vista Single
const CONFIG = {
	maxImageHeight: 600,
	rowPadding: 12, // px
	cardPadding: 12, // px
	increaseViewportBy: { top: 400, bottom: 800 } as { top: number; bottom: number },
	dateLocale: 'es-ES',
};

interface FileSingleProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

function getExtLabel(item: MediaItem): string {
	const n = (item.name || '').toLowerCase();
	const ext = n.includes('.') ? n.slice(n.lastIndexOf('.') + 1) : '';
	return ext || 'image';
}

function FileSingleRow({
	item,
	selected,
	onItemClick,
	onItemDoubleClick,
}: {
	item: MediaItem;
	selected: boolean;
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}) {
	const handleClick = () => onItemClick?.(item);
	const handleDoubleClick = () => onItemDoubleClick?.(item);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onItemClick?.(item);
		}
	};

	return (
		<div className="w-full p-3" style={{ padding: CONFIG.rowPadding }}>
			<div className="rounded-md border bg-card p-3" style={{ padding: CONFIG.cardPadding }}>
				<button
					aria-pressed={selected}
					className="mb-3 block w-full overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onKeyDown={handleKeyDown}
					style={{ maxHeight: CONFIG.maxImageHeight }}
					type="button"
				>
					<MediaThumbnail className="h-auto w-full" item={item} style={{ objectFit: 'contain' }} />
				</button>
				<div className="min-w-0">
					<h3 className={selected ? 'mb-1 truncate font-semibold' : 'mb-1 truncate font-medium'}>{item.name}</h3>
					<div className="mb-2 text-muted-foreground text-xs">{getExtLabel(item)}</div>
					<div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
						<div>
							<span className="text-muted-foreground">Tamaño:</span>{' '}
							<span>{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Dimensiones:</span>{' '}
							<span>{item.width && item.height ? `${item.width}×${item.height}` : 'N/A'}</span>
						</div>
						<div>
							<span className="text-muted-foreground">ID:</span> <span className="break-all">{item.id}</span>
						</div>
						<div className="col-span-2 sm:col-span-3 lg:col-span-4">
							<span className="text-muted-foreground">Ruta:</span> <span className="break-all">{item.path}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FileSingle({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileSingleProps) {
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
			<div style={{ height: '100%' }}>
				<VirtuosoComp
					data={items}
					increaseViewportBy={CONFIG.increaseViewportBy}
					itemContent={(index: number, item: MediaItem) => (
						<div data-index={index}>
							<FileSingleRow
								item={item}
								onItemClick={onItemClick}
								onItemDoubleClick={onItemDoubleClick}
								selected={selectedIds.includes(item.id)}
							/>
						</div>
					)}
					style={{ height: '100%' }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="h-full overflow-auto">
			{items.map((item) => (
				<FileSingleRow
					item={item}
					key={item.id}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
					selected={selectedIds.includes(item.id)}
				/>
			))}
		</div>
	);
}
