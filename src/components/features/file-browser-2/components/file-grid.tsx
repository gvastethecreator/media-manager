import type { ViewMode } from '@/store/ui/view-options.slice';
import type { ImageWithStats } from '@/types/entities/image';
import { GridItem } from './grid-item';

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
	itemSize = 150,
}: FileGridProps) {
	return (
		<div
			className="grid gap-4 p-4"
			style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, itemSize)}px, 1fr))`, ...style }}
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
