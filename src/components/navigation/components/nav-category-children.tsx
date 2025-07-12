import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoryChild, ViewMode } from '../types';

interface NavCategoryChildrenProps {
	categoryId: string;
	isCollapsed: boolean;
	selectedChildId: string | null;
	currentView: string;
	items: CategoryChild[];
	onItemClick: (id: string) => void;
	onToggleViewMode?: (mode: ViewMode) => void;
}

export const NavCategoryChildren = memo(function NavCategoryChildren({
	_categoryId,
	_isCollapsed,
	selectedChildId,
	_currentView,
	items,
	onItemClick,
}: NavCategoryChildrenProps) {
	if (!items || items.length === 0) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">No hay elementos</div>;
	}

	return (
		<div className="flex flex-col gap-0">
			{items.map((item) => (
				<Button
					key={item.id}
					variant="ghost"
					className={cn(
						'justify-between w-full text-xs px-2 py-0.5 rounded flex items-center hover:bg-secondary/30',
						selectedChildId === item.id && 'bg-secondary/50'
					)}
					onClick={() => onItemClick(item.id)}
				>
					<span className="flex items-center">
						{item.emoji && <span className="mr-1">{item.emoji}</span>}
						<span className="truncate">{item.name || item.label}</span>
					</span>
					{(item.itemCount || item._count?.images) && (
						<span className="ml-2 text-[9px] text-muted-foreground tabular-nums min-w-[12px] text-right">
							{item.itemCount || item._count?.images || 0}
						</span>
					)}
				</Button>
			))}
		</div>
	);
});

export default NavCategoryChildren;
