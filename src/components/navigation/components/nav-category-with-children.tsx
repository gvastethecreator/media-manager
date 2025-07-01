'use client';

import type { LucideIcon } from 'lucide-react';
import type React from 'react';
import { memo, useCallback } from 'react';
import { ViewType } from '@/components/views/types';
import type { CategoryChild } from '../types';
import { NavCategoryChildren } from './nav-category-children';
import { NavCategoryItem } from './nav-category-item';

const MemoizedNavCategoryChildren = memo(NavCategoryChildren);

export const NavCategoryWithChildren = memo(function NavCategoryWithChildren({
	id,
	label,
	color,
	icon,
	isCollapsed,
	isCurrent,
	itemCount,
	imageCount,
	isNavCollapsed,
	viewMode,
	getCategoryItems,
	onToggleCollapse,
	onCategoryClick,
	onToggleViewMode,
	getSelectedChildId,
	getItemClickHandler,
	currentView,
}: {
	id: ViewType;
	label: string;
	color: string;
	icon: LucideIcon;
	isCollapsed: boolean;
	isCurrent: boolean;
	itemCount: number;
	imageCount: number;
	isNavCollapsed: boolean;
	viewMode: 'list' | 'grid';
	getCategoryItems: (id: ViewType) => CategoryChild[];
	onToggleCollapse: (e: React.MouseEvent | React.KeyboardEvent) => void;
	onCategoryClick: () => void;
	onToggleViewMode: (mode: 'list' | 'grid') => void;
	getSelectedChildId: (id: ViewType) => string | null;
	getItemClickHandler: (id: ViewType) => (childId: string) => void;
	currentView: string;
}) {
	const handleViewModeToggle = useCallback(() => {
		// Alternar entre grid y list
		const newMode = viewMode === 'list' ? 'grid' : 'list';
		onToggleViewMode(newMode);
	}, [viewMode, onToggleViewMode]);

	return (
		<div key={id}>
			<NavCategoryItem
				id={id}
				label={label}
				color={color}
				icon={icon}
				isCollapsed={isNavCollapsed || isCollapsed}
				isCurrent={isCurrent}
				itemCount={itemCount}
				imageCount={imageCount}
				onClick={onCategoryClick}
				onToggleCollapse={onToggleCollapse}
				showLabel={!isNavCollapsed}
				onToggleViewMode={handleViewModeToggle}
				viewMode={viewMode}
			/>
			<MemoizedNavCategoryChildren
				key={`${id}-children`}
				categoryId={id}
				isCollapsed={isNavCollapsed || isCollapsed}
				selectedChildId={getSelectedChildId(id)}
				currentView={currentView}
				items={getCategoryItems(id)}
				onItemClick={getItemClickHandler(id)}
				onToggleViewMode={handleViewModeToggle}
			/>
		</div>
	);
});
