import { memo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CategoryChild } from '../types';
import { FolderTreeView } from './folder-tree-view';

interface NavCategoryChildrenProps {
	categoryId: string;
	getItemHref?: (item: CategoryChild) => string;
	isCollapsed: boolean;
	items: CategoryChild[];
}

const NavCategoryChildrenComponent = memo(function NavCategoryChildrenImpl({
	categoryId,
	getItemHref,
	isCollapsed,
	items,
}: NavCategoryChildrenProps) {
	// Para la categoría de carpetas, usar FolderTreeView
	if (categoryId === 'folders') {
		return (
			<div className="min-w-0 px-1">
				<FolderTreeView className="text-[11px]" isCollapsed={isCollapsed} selectedFolderId={null} />
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
				<Link
					className={cn(
						'flex w-full items-center justify-between rounded px-2 py-0.5 text-xs hover:bg-secondary/30',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
					)}
					key={item.id}
					to={getItemHref?.(item) ?? `/${categoryId}/${encodeURIComponent(item.id)}`}
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
				</Link>
			))}
		</div>
	);
});

export const NavCategoryChildren = NavCategoryChildrenComponent;
export default NavCategoryChildrenComponent;
