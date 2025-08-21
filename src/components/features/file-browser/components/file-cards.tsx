import { useEffect, useState } from 'react';
import type { ImageWithStats } from '@/types/entities/image';

// CONFIG local de la vista Cards
const CONFIG = {
	thumbSize: 240,
	rowPadding: 12, // px
	cardPadding: 12, // px
	increaseViewportBy: { top: 400, bottom: 800 } as { top: number; bottom: number },
	dateLocale: 'es-ES',
};

interface FileCardsProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
}

function getExtLabel(item: ImageWithStats): string {
	const n = (item.name || '').toLowerCase();
	const ext = n.includes('.') ? n.slice(n.lastIndexOf('.') + 1) : '';
	return ext || 'image';
}

function CardRow({
	item,
	selected,
	onItemClick,
	onItemDoubleClick,
}: {
	item: ImageWithStats;
	selected: boolean;
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
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
			<div className="flex gap-4 rounded-md border bg-card p-3" style={{ padding: CONFIG.cardPadding }}>
				<button
					type="button"
					aria-pressed={selected}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onKeyDown={handleKeyDown}
					className="shrink-0 overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					style={{ width: CONFIG.thumbSize, height: CONFIG.thumbSize }}
				>
					<img src={`/api/images/${item.id}/thumbnail`} alt={item.name} className="h-full w-full object-cover" />
				</button>
				<div className="min-w-0 flex-1 self-stretch">
					<div className="mb-2 flex items-start justify-between gap-2">
						<div className="min-w-0">
							<h3 className={selected ? 'truncate font-semibold' : 'truncate font-medium'}>{item.name}</h3>
							<p className="text-muted-foreground text-xs">{getExtLabel(item)}</p>
						</div>
						<div className="text-muted-foreground text-xs">
							{item.createdAt ? new Date(item.createdAt as any).toLocaleDateString(CONFIG.dateLocale) : ''}
						</div>
					</div>
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

export function FileCards({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileCardsProps) {
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
					itemContent={(index: number, item: ImageWithStats) => (
						<div data-index={index}>
							<CardRow
								item={item}
								selected={selectedIds.includes(item.id)}
								onItemClick={onItemClick}
								onItemDoubleClick={onItemDoubleClick}
							/>
						</div>
					)}
					increaseViewportBy={CONFIG.increaseViewportBy}
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
				<CardRow
					key={item.id}
					item={item}
					selected={selectedIds.includes(item.id)}
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
				/>
			))}
		</div>
	);
}
