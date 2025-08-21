import type { ImageWithStats } from '@/types/entities/image';

interface GridItemProps {
	item: ImageWithStats;
	size?: number;
	selected?: boolean;
	onClick?: (item: ImageWithStats) => void;
	onDoubleClick?: (item: ImageWithStats) => void;
}

export function GridItem({ item, onClick, onDoubleClick, size = 150, selected = false }: GridItemProps) {
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
			className="group relative overflow-hidden rounded-md border bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			style={{ aspectRatio: '1 / 1', width: '100%', minWidth: size, minHeight: size }}
			type="button"
			aria-pressed={selected}
			data-selected={selected}
		>
			<img alt={item.name} className="h-full w-full object-cover" src={thumbnailUrl} />
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				<p className="truncate font-medium text-white text-xs">{item.name}</p>
			</div>
			{selected && <div className="absolute inset-0 ring-2 ring-primary ring-offset-2" aria-hidden="true" />}
		</button>
	);
}
