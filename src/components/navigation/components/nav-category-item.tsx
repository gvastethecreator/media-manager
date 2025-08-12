import { ChevronRight, Grid, List, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewType } from '@/components/views/types';
import { cn } from '@/lib/utils';

// Componente memoizado para el indicador de colapso
const CollapseIndicatorComponent = memo(function CollapseIndicator({
	isCollapsed,
	onToggleCollapse,
	color = '#888888',
}: {
	isCollapsed: boolean;
	onToggleCollapse: (e: React.MouseEvent | React.KeyboardEvent) => void;
	color?: string;
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
		<button
			aria-label={isCollapsed ? 'Expandir categoría' : 'Colapsar categoría'}
			className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-colors hover:bg-gray-100/10"
			onClick={onToggleCollapse}
			onKeyDown={handleKeyDown}
			type="button"
		>
			<motion.div animate={animateConfig} initial={false} transition={transitionConfig}>
				<ChevronRight className="h-3 w-3" style={{ color }} />
			</motion.div>
		</button>
	);
});

// Componente memoizado para los contadores
const CategoryCountersComponent = memo(function CategoryCounters({
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
			<div className="nav-count-badge inline-flex min-w-[24px] items-center justify-center rounded-sm bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
				{itemCount}
			</div>

			<div className="nav-count-badge inline-flex min-w-[24px] items-center justify-center rounded-sm bg-muted/30 px-1.5 py-0.5 text-[9px] text-muted-foreground">
				{imageCount}
			</div>

			{/* Botón para cambiar de vista - a la derecha de los badges */}
			{!isCollapsed && onToggleViewMode && (
				<button
					className="ml-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-background/50 p-0 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
					onClick={handleViewModeToggle}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							// Simular un click para el manejador que espera MouseEvent
							const mockEvent = {
								// no-op para simular MouseEvent sin efectos
								stopPropagation: () => {
									/* no-op */
								},
							} as React.MouseEvent;
							handleViewModeToggle(mockEvent);
						}
					}}
					title={viewMode === 'list' ? 'Cambiar a vista de cuadrícula' : 'Cambiar a vista de lista'}
					type="button"
				>
					{viewMode === 'list' ? <Grid className="h-3 w-3" /> : <List className="h-3 w-3" />}
				</button>
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

export const NavCategoryItem = memo(function NavCategoryItemImpl({
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
				'group nav-category-item mt-0 flex h-7 w-full items-center rounded-none border-l-2 transition-all duration-150 hover:border-opacity-100',
				!showLabel && 'justify-center pl-0'
			),
		[showLabel]
	);

	const buttonClasses = useMemo(
		() =>
			cn(
				'h-7 flex-1 cursor-pointer justify-start gap-2 rounded-none px-2 py-0 text-xs transition-all',
				!showLabel && 'w-full justify-center px-1',
				isCurrent ? 'bg-secondary/30' : 'hover:bg-secondary/10'
			),
		[showLabel, isCurrent]
	);

	const _handleViewModeToggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleViewMode?.();
		},
		[onToggleViewMode]
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
			{showLabel && (
				<CollapseIndicatorComponent color={color} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
			)}

			{/* Botón de categoría */}
			<Button
				className={buttonClasses}
				onClick={onClick}
				style={{
					backgroundColor: isCurrent ? colorWithOpacity : undefined,
				}}
				variant="ghost"
			>
				<Icon className="h-3.5 w-3.5 shrink-0" />

				{showLabel && (
					<>
						<span className="flex-1 truncate text-left font-medium">{label}</span>

						<CategoryCountersComponent
							imageCount={imageCount}
							isCollapsed={isCollapsed}
							itemCount={itemCount}
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
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>{categoryItem}</TooltipTrigger>
					<TooltipContent className="p-2 text-xs">
						<p className="font-medium text-amber-400">{label}</p>
						<p className="flex items-center gap-2">
							<span className="inline-flex min-w-[24px] items-center justify-center rounded-sm bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
								{itemCount}
							</span>
							<span>elementos</span>
						</p>
						<p className="flex items-center gap-2">
							<span className="inline-flex min-w-[24px] items-center justify-center rounded-sm bg-muted/30 px-1.5 py-0.5 text-[9px] text-muted-foreground">
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
