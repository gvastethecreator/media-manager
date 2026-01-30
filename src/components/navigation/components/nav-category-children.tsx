import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoryChild, ViewMode } from '../types';
import { FolderTreeView } from './folder-tree-view';

interface NavCategoryChildrenProps {
	categoryId: string;
	isCollapsed: boolean;
	selectedChildId: string | null;
	currentView: string;
	items: CategoryChild[];
	onItemClick: (id: string) => void;
	onToggleViewMode?: (mode: ViewMode) => void;
}

const NavCategoryChildrenComponent = memo(function NavCategoryChildrenImpl({
	categoryId,
	isCollapsed,
	selectedChildId,
	currentView: _currentView,
	items,
	onItemClick,
}: NavCategoryChildrenProps) {
	// Para la categoría de carpetas, usar FolderTreeView
	if (categoryId === 'folders') {
		return (
			<div className="px-1">
				<FolderTreeView className="text-[11px]" isCollapsed={isCollapsed} selectedFolderId={selectedChildId} />
			</div>
		);
	}

	// Para otras categorías, usar la lista normal
	if (!items || items.length === 0) {
		return <div className="py-1 text-[10px] text-muted-foreground italic">No hay elementos</div>;
	}

	return (
		<div className="flex flex-col gap-0">
			{items.map((item) => (
				<Button
					className={cn(
						'flex w-full items-center justify-between rounded px-2 py-0.5 text-xs hover:bg-secondary/30',
						selectedChildId === item.id && 'bg-secondary/50'
					)}
					key={item.id}
					onClick={() => onItemClick(item.id)}
					variant="ghost"
				>
					<span className="flex items-center">
						{item.emoji && <span className="mr-1">{item.emoji}</span>}
						<span className="truncate">{item.name || item.label}</span>
					</span>
					{(item.itemCount || item._count?.images) && (
						<span className="ml-2 min-w-[12px] text-right text-[9px] text-muted-foreground tabular-nums">
							{item.itemCount || item._count?.images || 0}
						</span>
					)}
				</Button>
			))}
		</div>
	);
});

export const NavCategoryChildren = NavCategoryChildrenComponent;
export default NavCategoryChildrenComponent;
