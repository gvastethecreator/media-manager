/**
 * @file Vista masonry mejorada tipo Pinterest con configuración avanzada
 * @module components/features/file-browser/views/masonry-view
 */

import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { useMasonryViewConfig } from '@/hooks/use-masonry-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface MasonryViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

interface MasonryItemProps {
	layoutItem: {
		item: AnyEntityWithStats;
		x: number;
		y: number;
		width: number;
		height: number;
		aspectRatio: number;
	};
	isSelected: boolean;
	itemIndex: number;
	onItemClickById: (id: string, e: React.MouseEvent) => void;
	onItemDoubleClickById: (id: string) => void;
}

// Componente interno memoizado para cada item con optimizaciones avanzadas
const MasonryItem = memo<MasonryItemProps>(function MasonryItem({
	layoutItem,
	isSelected,
	itemIndex,
	onItemClickById,
	onItemDoubleClickById,
}) {
	const { config } = useMasonryViewConfig();

	// OPTIMIZACIÓN: Estabilizar handlers con dependencias mínimas
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClickById(layoutItem.item.id, e);
		},
		[layoutItem.item.id, onItemClickById]
	);

	const handleDoubleClick = useCallback(() => {
		onItemDoubleClickById(layoutItem.item.id);
	}, [layoutItem.item.id, onItemDoubleClickById]);

	// OPTIMIZACIÓN: Memoizar clases CSS para evitar recálculos innecesarios
	const itemClasses = useMemo(() => {
		const baseClasses = 'absolute cursor-pointer transition-all duration-200';
		const hoverClasses = config.hoverEffects ? 'hover:z-10 hover:scale-105 hover:rotate-1' : '';
		const shadowClasses = config.showShadows ? 'shadow-sm hover:shadow-lg' : '';
		const roundedClasses = config.roundedCorners ? 'rounded-lg overflow-hidden' : '';
		const selectionClasses = isSelected && config.showSelectionIndicators ? 'ring-2 ring-primary ring-offset-2' : '';

		return cn(baseClasses, hoverClasses, shadowClasses, roundedClasses, selectionClasses);
	}, [config.hoverEffects, config.showShadows, config.roundedCorners, config.showSelectionIndicators, isSelected]);

	// OPTIMIZACIÓN: Solo calcular transición si las animaciones están habilitadas
	const transition = useMemo(() => {
		if (!config.animationsEnabled) return undefined;

		return {
			duration: config.animationDuration / 1000,
			delay: Math.min(itemIndex * 0.02, 0.4),
			type: 'spring' as const,
			stiffness: 100,
			damping: 15,
		};
	}, [config.animationsEnabled, config.animationDuration, itemIndex]);

	// OPTIMIZACIÓN: Memoizar props de posición y tamaño
	const style = useMemo(() => ({
		left: `${layoutItem.x}px`,
		top: `${layoutItem.y}px`,
		width: `${layoutItem.width}px`,
		height: `${layoutItem.height}px`,
	}), [layoutItem.x, layoutItem.y, layoutItem.width, layoutItem.height]);

	// OPTIMIZACIÓN: Solo usar motion.div si las animaciones están habilitadas
	if (!config.animationsEnabled) {
		return (
			<div
				className={itemClasses}
				style={style}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
			>
				<OptimizedEntityCard
					entity={layoutItem.item}
					layout="vertical"
					size="md"
					isSelected={isSelected}
					compact={false}
					className="w-full h-full"
					itemId={layoutItem.item.id}
					onClickById={onItemClickById}
					onDoubleClickById={onItemDoubleClickById}
				/>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 30, scale: 0.8 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={transition}
			className={itemClasses}
			style={style}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
		>
			<OptimizedEntityCard
				entity={layoutItem.item}
				layout="vertical"
				size="md"
				isSelected={isSelected}
				compact={false}
				className="w-full h-full"
				itemId={layoutItem.item.id}
				onClickById={onItemClickById}
				onDoubleClickById={onItemDoubleClickById}
			/>
		</motion.div>
	);
}, (prevProps, nextProps) => {
	// OPTIMIZACIÓN: Comparación personalizada para evitar re-renders innecesarios
	return (
		prevProps.layoutItem.item.id === nextProps.layoutItem.item.id &&
		prevProps.layoutItem.x === nextProps.layoutItem.x &&
		prevProps.layoutItem.y === nextProps.layoutItem.y &&
		prevProps.layoutItem.width === nextProps.layoutItem.width &&
		prevProps.layoutItem.height === nextProps.layoutItem.height &&
		prevProps.isSelected === nextProps.isSelected &&
		prevProps.itemIndex === nextProps.itemIndex &&
		prevProps.onItemClickById === nextProps.onItemClickById &&
		prevProps.onItemDoubleClickById === nextProps.onItemDoubleClickById
	);
});

export const MasonryView = memo<MasonryViewProps>(function MasonryView({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
	const [containerHeight, setContainerHeight] = useState<number>(600);
	const { config, calculateLayout } = useMasonryViewConfig();

	// Map optimizado para lookups O(1)
	const itemsById = useMemo(() => {
		const map = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			map.set(item.id, item);
		}
		return map;
	}, [items]);

	// Set optimizado para verificación de selección O(1)
	const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	// Handlers optimizados con Map lookups
	const handleItemClickById = useCallback(
		(id: string, e: React.MouseEvent) => {
			const item = itemsById.get(id);
			if (item) {
				onItemClick(item, e);
			}
		},
		[itemsById, onItemClick]
	);

	const handleItemDoubleClickById = useCallback(
		(id: string) => {
			const item = itemsById.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		},
		[itemsById, onItemDoubleClick]
	);

	// Calcular layout usando el nuevo algoritmo
	const layoutResult = useMemo(() => {
		return calculateLayout(items, containerWidth);
	}, [calculateLayout, items, containerWidth]);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			const isEmptySpaceClick =
				target === currentTarget ||
				(!target.closest('.entity-card') &&
					!target.closest('[data-entity-card]') &&
					!target.closest('button') &&
					!target.closest('[role="button"]') &&
					!target.closest('input') &&
					!target.closest('textarea') &&
					!target.closest('[data-testid="file-browser-item"]') &&
					!target.closest('[style*="position: absolute"]') &&
					!target.closest('[data-virtualized-item="true"]'));

			if (isEmptySpaceClick && selectedIds.length > 0) {
				currentTarget.style.transition = 'background-color 0.15s ease';
				currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';

				setTimeout(() => {
					currentTarget.style.backgroundColor = '';
					currentTarget.style.transition = '';
				}, 150);
			}
		},
		[selectedIds.length]
	);

	// Efecto para medir altura del contenedor
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				const observer = new ResizeObserver((entries) => {
					for (const entry of entries) {
						const height = entry.contentRect.height;
						if (height > 0) {
							setContainerHeight(height - config.spacing.padding * 2);
						}
					}
				});
				observer.observe(scrollAreaViewport);
				return () => observer.disconnect();
			}
		}
	}, [config.spacing.padding]);

	if (!containerWidth || containerWidth <= 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-muted-foreground">Calculando layout masonry...</div>
			</div>
		);
	}

	return (
		<div
			ref={parentRef}
			className="w-full overflow-auto"
			data-testid="masonry-view"
			data-view-type="masonry"
			onClick={handleEmptySpaceClick}
			style={{
				height: `${containerHeight}px`,
				contain: 'strict',
				padding: `${config.spacing.padding}px`,
			}}
		>
			{/* Información de debug del layout (opcional) */}
			{process.env.NODE_ENV === 'development' && (
				<div className="fixed top-2 right-2 z-50 bg-background/90 backdrop-blur-sm border rounded p-2 text-xs font-mono">
					<div>Columns: {layoutResult.columns}</div>
					<div>Algorithm: {config.optimization.algorithm}</div>
					<div>Balance: {(layoutResult.balance.balanceFactor * 100).toFixed(1)}%</div>
					<div>Height diff: {layoutResult.balance.heightDifference.toFixed(0)}px</div>
				</div>
			)}

			{/* Contenedor de items con posicionamiento absoluto */}
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: `${layoutResult.totalHeight}px`,
				}}
			>
				<AnimatePresence initial={false}>
					{layoutResult.items.map((layoutItem, index) => {
						const isSelected = selectedIdsSet.has(layoutItem.item.id);

						return (
							<MasonryItem
								key={layoutItem.item.id}
								layoutItem={layoutItem}
								isSelected={isSelected}
								itemIndex={index}
								onItemClickById={handleItemClickById}
								onItemDoubleClickById={handleItemDoubleClickById}
							/>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
});
