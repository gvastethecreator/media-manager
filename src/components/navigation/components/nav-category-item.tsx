'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/file-item';
import { ChevronRight, Grid, List, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { memo, useCallback, useMemo } from 'react';

// Componente memoizado para el indicador de colapso
const CollapseIndicator = memo(function CollapseIndicator({
	isCollapsed,
	onToggleCollapse,
}: {
	isCollapsed: boolean;
	onToggleCollapse: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) {
	// Usamos memoización para la configuración de la animación
	const animateConfig = useMemo(
		() => ({
			rotate: isCollapsed ? 0 : 90,
		}),
		[isCollapsed]
	);

	const transitionConfig = useMemo(
		() => ({
			duration: 0.15,
			repeatType: 'reverse' as const,
			ease: 'easeOut' as const,
		}),
		[]
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				onToggleCollapse(e);
			}
		},
		[onToggleCollapse]
	);

	return (
		<div
			className="flex h-5 w-5 shrink-0 items-center justify-center hover:bg-gray-100/10 border-0 bg-transparent p-0 transition-colors cursor-pointer"
			onClick={onToggleCollapse}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}
		>
			<motion.div initial={false} animate={animateConfig} transition={transitionConfig}>
				<ChevronRight className="h-3 w-3 text-foreground/60" />
			</motion.div>
		</div>
	);
});

// Componente memoizado para los contadores
const CategoryCounters = memo(function CategoryCounters({
	itemCount,
	imageCount,
	isCollapsed,
	onToggleViewMode,
	viewMode,
}: {
	itemCount: number;
	imageCount: number;
	isCollapsed: boolean;
	onToggleViewMode?: () => void;
	viewMode?: 'list' | 'grid';
}) {
	const handleViewModeToggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleViewMode?.();
		},
		[onToggleViewMode]
	);

	return (
		<div className="flex items-center space-x-2">
			<div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/60 text-muted-foreground min-w-[24px] nav-count-badge">
				{itemCount}
			</div>

			<div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/30 text-muted-foreground min-w-[24px] nav-count-badge">
				{imageCount}
			</div>

			{/* Botón para cambiar de vista - a la derecha de los badges */}
			{!isCollapsed && onToggleViewMode && (
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="h-5 w-5 p-0 bg-background/50 hover:bg-secondary/60 rounded text-muted-foreground hover:text-foreground transition-all ml-1"
					title={viewMode === 'list' ? 'Cambiar a vista de cuadrícula' : 'Cambiar a vista de lista'}
				>
					<div onClick={handleViewModeToggle}>
						{viewMode === 'list' ? <Grid className="h-3 w-3" /> : <List className="h-3 w-3" />}
					</div>
				</Button>
			)}
		</div>
	);
});

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
	showLabel?: boolean;
	onToggleViewMode?: () => void;
	viewMode?: 'list' | 'grid';
}

export const NavCategoryItem = memo(function NavCategoryItem({
	id,
	label,
	color,
	icon: Icon,
	isCollapsed,
	isCurrent,
	itemCount,
	imageCount,
	onClick,
	onToggleCollapse,
	showLabel = true,
	onToggleViewMode,
	viewMode = 'list',
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

	// Memoizar clases para evitar recreaciones
	const containerClasses = useMemo(
		() =>
			cn(
				'flex items-center w-full h-7 rounded-none mt-0 group border-l-2 hover:border-opacity-100 transition-all duration-150 nav-category-item',
				!showLabel && 'justify-center pl-0'
			),
		[showLabel]
	);

	const buttonClasses = useMemo(
		() =>
			cn(
				'flex-1 justify-start gap-2 h-7 px-2 py-0 transition-all text-xs rounded-none cursor-pointer',
				!showLabel && 'justify-center px-1 w-full',
				isCurrent ? 'bg-secondary/30' : 'hover:bg-secondary/10'
			),
		[showLabel, isCurrent]
	);

	const categoryItem = (
		<div
			className={containerClasses}
			style={{
				borderLeftColor: color,
				borderLeftWidth: isCurrent ? '2px' : '0px',
				color,
			}}
		>
			{/* Botón específico para colapsar/expandir - solo visible cuando se muestran las etiquetas */}
			{showLabel && <CollapseIndicator isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />}

			{/* Botón de categoría */}
			<Button
				variant="ghost"
				className={buttonClasses}
				style={{
					backgroundColor: isCurrent ? colorWithOpacity : undefined,
				}}
				onClick={onClick}
			>
				<Icon className="h-3.5 w-3.5 shrink-0" />

				{showLabel && (
					<>
						<span className="flex-1 text-left truncate font-medium">{label}</span>

						<CategoryCounters
							itemCount={itemCount}
							imageCount={imageCount}
							isCollapsed={isCollapsed}
							onToggleViewMode={onToggleViewMode}
							viewMode={viewMode}
						/>
					</>
				)}
			</Button>
		</div>
	);

	// Si el panel está colapsado, envolver en un tooltip
	if (!showLabel) {
		return (
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>{categoryItem}</TooltipTrigger>
					<TooltipContent side="right" className="text-xs p-2">
						<p className="font-medium text-amber-400">{label}</p>
						<p className="flex items-center gap-2">
							<span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/60 text-muted-foreground min-w-[24px]">
								{itemCount}
							</span>
							<span>elementos</span>
						</p>
						<p className="flex items-center gap-2">
							<span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] bg-muted/30 text-muted-foreground min-w-[24px]">
								{imageCount}
							</span>
							<span>imágenes</span>
						</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return categoryItem;
});
