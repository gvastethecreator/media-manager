import type { ImageWithStats } from '@/types/entities/image';
import { ListItem } from './list-item';

interface FileListProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
}

export function FileList({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileListProps) {
	return (
		<div className="flex flex-col gap-1 p-2">
			{items.map((item) => (
				<ListItem
					item={item}
					key={item.id}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					selected={selectedIds.includes(item.id)}
				/>
			))}
		</div>
	);
}
