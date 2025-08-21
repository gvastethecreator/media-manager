import { useEffect, useMemo, useState } from 'react';
import type { ImageWithStats } from '@/types/entities/image';

interface FileMasonryProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
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
	item: ImageWithStats;
	selected: boolean;
	onClick?: (item: ImageWithStats) => void;
	onDoubleClick?: (item: ImageWithStats) => void;
}) {
	const thumbnailUrl = `/api/images/${item.id}/thumbnail`;

	const handleClick = () => onClick?.(item);
	const handleDoubleClick = () => onDoubleClick?.(item);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick?.(item);
		}
	};

	return (
		<button
			type="button"
			aria-pressed={selected}
			data-selected={selected}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			className="group relative w-full overflow-hidden rounded-md border bg-card text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		>
			<img alt={item.name} src={thumbnailUrl} className="h-auto w-full object-cover" />
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				<p className="truncate font-medium text-white text-xs">{item.name}</p>
			</div>
			{selected ? <span className="absolute inset-0 ring-2 ring-primary ring-offset-2" aria-hidden="true" /> : null}
		</button>
	);
}

// Masonry con react-virtuoso (carga dinámica) y fallback a CSS columns
export function FileMasonry({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileMasonryProps) {
	const [VirtuosoMasonryComp, setVirtuosoMasonryComp] = useState<any>(null);
	const width = useWindowWidth();

	// Columnas responsivas similares a las usadas antes (sm/md/lg)
	const columnCount = useMemo(() => {
		if (width < 640) return 2; // sm
		if (width < 1024) return 3; // md
		if (width < 1280) return 4; // lg
		return 5; // xl+
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
					// estilo alto completo para usar el contenedor como viewport
					style={{ height: '100%' }}
					data={items}
					columnCount={columnCount}
					ItemContent={function ItemContentComp({ data }: { data: ImageWithStats }) {
						return (
							<div style={{ padding: '8px' }}>
								<MasonryTile
									item={data}
									selected={selectedIds.includes(data.id)}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
								/>
							</div>
						);
					}}
					computeItemKey={({ data }: { data: ImageWithStats }) => data.id}
					initialItemCount={Math.min(50, items.length)}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback: CSS columns (previa implementación)
	return (
		<div className="columns-1 gap-4 p-4 sm:columns-2 md:columns-3 lg:columns-4">
			{items.map((item) => (
				<div key={item.id} className="mb-4 break-inside-avoid">
					<MasonryTile
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
