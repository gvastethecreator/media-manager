import { useEffect, useState } from 'react';
import type { ViewMode } from '@/store/ui/view-options.slice';
import type { ImageWithStats } from '@/types/entities/image';
import { GridItem } from './grid-item';

// CONFIG local de la vista Grid
const CONFIG = {
	gap: 16, // px
	padding: 16, // px
	baseItemSize: 150,
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
};

interface FileGridProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	viewMode?: ViewMode;
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
	style?: React.CSSProperties;
	itemSize?: number;
}

export function FileGrid({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	style,
	itemSize = CONFIG.baseItemSize,
}: FileGridProps) {
	const [VirtuosoGridComp, setVirtuosoGridComp] = useState<any>(null);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).VirtuosoGrid || null;
				setVirtuosoGridComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoGridComp) {
		return (
			<div style={{ height: '100%' }}>
				<VirtuosoGridComp
					data={items}
					itemContent={(index: number, item: ImageWithStats) => (
						<div data-index={index}>
							<GridItem
								item={item}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
								selected={selectedIds.includes(item.id)}
								size={itemSize}
							/>
						</div>
					)}
					listClassName="grid"
					// Estilos del contenedor de la lista (grid): aquí debe ir gridTemplateColumns
					// para que VirtuosoGrid distribuya correctamente las columnas.
					listStyle={{ gap: CONFIG.gap, padding: CONFIG.padding, ...style }}
					increaseViewportBy={CONFIG.increaseViewportBy}
					// Estilos del contenedor externo del virtuoso (altura)
					style={{ height: '100%' }}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div
			className="grid"
			style={{
				gap: CONFIG.gap,
				padding: CONFIG.padding,
				gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, itemSize)}px, 1fr))`,
				...style,
			}}
		>
			{items.map((item) => (
				<GridItem
					item={item}
					key={item.id}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					selected={selectedIds.includes(item.id)}
					size={itemSize}
				/>
			))}
		</div>
	);
}
