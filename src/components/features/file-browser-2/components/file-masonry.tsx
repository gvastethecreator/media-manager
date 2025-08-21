import type { ImageWithStats } from '@/types/entities/image';
import { GridItem } from './grid-item';

interface FileMasonryProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
}

// Placeholder simple: usa CSS columns para masonry básico
export function FileMasonry({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileMasonryProps) {
	return (
		<div className="columns-1 gap-4 p-4 sm:columns-2 md:columns-3 lg:columns-4">
			{items.map((item) => (
				<div key={item.id} className="mb-4 break-inside-avoid">
					<GridItem
						item={item}
						selected={selectedIds.includes(item.id)}
						onClick={onItemClick}
						onDoubleClick={onItemDoubleClick}
						size={200}
					/>
				</div>
			))}
		</div>
	);
}
