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
	children,
	isNavCollapsed,
}: {
	id: ViewType;
	label: string;
	color: string;
	icon: LucideIcon;
	children: React.ReactNode;
	isNavCollapsed: boolean;
}) {
	return (
		<div key={id}>
			<div className="flex items-center gap-2 mb-1">
				{icon && <icon className="h-4 w-4" style={{ color }} />}
				<span className="font-semibold text-xs" style={{ color }}>
					{label}
				</span>
			</div>
			<div className="flex flex-col gap-1">{children}</div>
		</div>
	);
});
