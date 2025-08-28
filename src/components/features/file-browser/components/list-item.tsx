import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format.utils';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

interface ListItemProps {
	item: MediaItem;
	selected?: boolean;
	onClick?: (item: MediaItem) => void;
	onDoubleClick?: (item: MediaItem) => void;
}

export function ListItem({ item, selected = false, onClick, onDoubleClick }: ListItemProps) {
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
			className={cn('flex items-center gap-4 rounded-md p-2 hover:bg-accent', selected && 'bg-accent')}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			type="button"
		>
			<div className="relative h-10 w-10 shrink-0">
				<MediaThumbnail className="h-full w-full rounded-sm" item={item} style={{ objectFit: 'cover' }} />
			</div>
			<div className="flex-1 truncate">
				<p className="truncate font-medium">{item.name}</p>
			</div>
			<div className="hidden w-24 text-muted-foreground text-sm md:block">
				{formatDate(item.createdAt ?? 0, { day: '2-digit', month: '2-digit', year: 'numeric' })}
			</div>
			<div className="hidden w-20 text-muted-foreground text-sm lg:block">
				{item.width && item.height ? `${item.width}x${item.height}` : 'N/A'}
			</div>
			<div className="hidden w-24 text-muted-foreground text-sm xl:block">
				{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}
			</div>
		</button>
	);
}
