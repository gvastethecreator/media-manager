import { useEffect, useMemo, useState } from 'react';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

// CONFIG local de la vista Masonry
const CONFIG = {
	gap: 16,
	padding: 16,
	smCols: 2,
	mdCols: 3,
	lgCols: 4,
	xlCols: 5,
	increaseViewportBy: { top: 200, bottom: 800 } as { top: number; bottom: number },
};

interface FileMasonryProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

// Hook simple para width de ventana (breakpoints tipo Tailwind)
function useWindowWidth() {
	const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const handler = () => setWidth(window.innerWidth);
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	}, []);
	return width;
}

// Tile específico para Masonry: respeta altura natural del thumbnail (no cuadrado)
function MasonryTile({
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
	const handleClick = () => onClick?.(item);
	const handleDoubleClick = () => onDoubleClick?.(item);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick?.(item);
		}
	};

	return (
		<button
			aria-pressed={selected}
			className="group relative w-full overflow-hidden rounded-md border-none bg-card text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			data-selected={selected}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			type="button"
		>
			<MediaThumbnail className="h-auto w-full" item={item} style={{ objectFit: 'cover' }} />
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				<p className="truncate font-medium text-white text-xs">{item.name}</p>
			</div>
			{selected ? <span aria-hidden="true" className="absolute inset-0 ring-2 ring-primary ring-offset-2" /> : null}
		</button>
	);
}

// Masonry con react-virtuoso (carga dinámica) y fallback a CSS columns
export function FileMasonry({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileMasonryProps) {
	const [VirtuosoMasonryComp, setVirtuosoMasonryComp] = useState<any>(null);
	const width = useWindowWidth();

	// Columnas responsivas similares a las usadas antes (sm/md/lg)
	const columnCount = useMemo(() => {
		if (width < 640) return CONFIG.smCols; // sm
		if (width < 1024) return CONFIG.mdCols; // md
		if (width < 1280) return CONFIG.lgCols; // lg
		return CONFIG.xlCols; // xl+
	}, [width]);

	useEffect(() => {
		let mounted = true;
		// Carga dinámica: si no está instalado el paquete, permanece el fallback
		import('@virtuoso.dev/masonry')
			.then((mod) => {
				if (!mounted) return;
				// Algunos bundlers exportan default, otros nombrado
				const Comp = (mod as any).VirtuosoMasonry || (mod as any).default || null;
				setVirtuosoMasonryComp(() => Comp);
			})
			.catch(() => {
				// Silencioso: usamos fallback
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoMasonryComp) {
		return (
			<div className="h-full">
				<VirtuosoMasonryComp
					columnCount={columnCount}
					computeItemKey={({ data }: { data: MediaItem }) => data.id}
					data={items}
					ItemContent={function ItemContentComp({ data }: { data: MediaItem }) {
						return (
							<div style={{ padding: `${CONFIG.gap / 2}px` }}>
								<MasonryTile
									item={data}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									selected={selectedIds.includes(data.id)}
								/>
							</div>
						);
					}}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(50, items.length)}
					style={{ height: '100%' }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback: CSS columns (previa implementación)
	return (
		<div className="columns-1" style={{ gap: CONFIG.gap, padding: CONFIG.padding }}>
			{items.map((item) => (
				<div className="mb-4 break-inside-avoid" key={item.id} style={{ marginBottom: CONFIG.gap }}>
					<MasonryTile
						item={item}
						onClick={onItemClick}
						onDoubleClick={onItemDoubleClick}
						selected={selectedIds.includes(item.id)}
					/>
				</div>
			))}
		</div>
	);
}
