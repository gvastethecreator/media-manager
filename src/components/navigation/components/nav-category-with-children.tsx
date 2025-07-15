import type { LucideIcon } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { ViewType } from '@/components/views/types';
import { NavCategoryChildren } from './nav-category-children';

const MemoizedNavCategoryChildren = memo(NavCategoryChildren);

export const NavCategoryWithChildren = memo(function NavCategoryWithChildren({
	id,
	label,
	color,
	icon,
	children,
}: {
	id: ViewType;
	label: string;
	color: string;
	icon: LucideIcon;
	children: React.ReactNode;
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
