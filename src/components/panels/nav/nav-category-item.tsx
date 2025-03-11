'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import type { ViewType } from '@/types/file-item';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useMemo } from 'react';

interface NavCategoryItemProps {
	id: ViewType;
	label: string;
	color: string;
	icon: LucideIcon;
	isCollapsed: boolean;
	isCurrent: boolean;
	itemCount: number;
	imageCount: number;
	onClick: () => void;
	onToggleCollapse: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

export function NavCategoryItem({
	label,
	color,
	icon: Icon,
	isCollapsed,
	isCurrent,
	itemCount,
	imageCount,
	onClick,
	onToggleCollapse,
}: NavCategoryItemProps) {
	const colorWithOpacity = useMemo(() => {
		// Convertir el color a rgba con una opacidad de 0.2
		let hexColor = color;
		if (hexColor.startsWith('#')) {
			hexColor = hexColor.slice(1);
		}

		const r = Number.parseInt(hexColor.substr(0, 2), 16);
		const g = Number.parseInt(hexColor.substr(2, 2), 16);
		const b = Number.parseInt(hexColor.substr(4, 2), 16);

		return `rgba(${r}, ${g}, ${b}, 0.15)`;
	}, [color]);

	return (
		<div
			className="flex items-center w-full h-7 rounded-none mt-0 group border-l-2 hover:border-opacity-100 transition-all duration-150 nav-category-item"
			style={{
				borderLeftColor: color,
				borderLeftWidth: isCurrent ? '2px' : '0px',
				color,
			}}
		>
			{/* Botón específico para colapsar/expandir */}
			<button
				type="button"
				className="flex h-5 w-5 shrink-0 items-center justify-center hover:bg-gray-100/10 border-0 bg-transparent p-0 transition-colors cursor-pointer"
				onClick={onToggleCollapse}
				aria-label={isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}
			>
				<motion.div initial={false} animate={{ rotate: isCollapsed ? 0 : 90 }} transition={{ duration: 0.15 }}>
					<ChevronRight className="h-3 w-3 text-foreground/60" />
				</motion.div>
			</button>

			{/* Botón de categoría */}
			<Button
				variant="ghost"
				className={cn(
					'flex-1 justify-start gap-2 h-7 px-2 py-0 text-sm transition-all text-xs rounded-none cursor-pointer',
					isCurrent ? 'bg-secondary/30' : 'hover:bg-secondary/10'
				)}
				style={{
					backgroundColor: isCurrent ? colorWithOpacity : undefined,
				}}
				onClick={onClick}
			>
				<Icon className="h-3.5 w-3.5 shrink-0" />
				<span className="flex-1 text-left truncate font-medium">{label}</span>

				<div className="flex items-center space-x-2">
					<div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/60 text-muted-foreground min-w-[24px] nav-count-badge">
						{itemCount}
					</div>

					<div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/30 text-muted-foreground min-w-[24px] nav-count-badge">
						{imageCount}
					</div>
				</div>
			</Button>
		</div>
	);
}
