/**
 * @file Vista masonry mejorada tipo Pinterest con configuración avanzada
 * @module components/features/file-browser/views/masonry-view
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
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

// Componente interno memoizado para cada item
const MasonryItem = memo<{
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
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}>(function MasonryItem({
	layoutItem,
	isSelected,
	itemIndex,
	onItemClick,
	onItemDoubleClick,
}) {
	const { config } = useMasonryViewConfig();

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClick(layoutItem.item, e);
		},
		[layoutItem.item, onItemClick]
	);

	const handleDoubleClick = useCallback(() => {
		onItemDoubleClick(layoutItem.item);
	}, [layoutItem.item, onItemDoubleClick]);

	const itemClasses = useMemo(() => {
		const baseClasses = 'absolute cursor-pointer transition-all duration-200';
		const hoverClasses = config.hoverEffects
			? 'hover:z-10 hover:scale-105 hover:rotate-1'
			: '';
		const shadowClasses = config.showShadows
			? 'shadow-sm hover:shadow-lg'
			: '';
		const roundedClasses = config.roundedCorners
			? 'rounded-lg overflow-hidden'
			: '';
		const selectionClasses = isSelected && config.showSelectionIndicators
			? 'ring-2 ring-primary ring-offset-2'
			: '';

		return cn(
			baseClasses,
			hoverClasses,
			shadowClasses,
			roundedClasses,
			selectionClasses
		);
	}, [config, isSelected]);

	const transition = useMemo(() => {
		if (!config.animationsEnabled) return {};

		return {
			duration: config.animationDuration / 1000,
			delay: Math.min(itemIndex * 0.02, 0.4),
			type: 'spring' as const,
			stiffness: 100,
			damping: 15,
		};
	}, [config.animationsEnabled, config.animationDuration, itemIndex]);

	return (
		<motion.div
			initial={config.animationsEnabled ? { opacity: 0, y: 30, scale: 0.8 } : false}
			animate={config.animationsEnabled ? { opacity: 1, y: 0, scale: 1 } : false}
			transition={transition}
			className={itemClasses}
			style={{
				left: `${layoutItem.x}px`,
				top: `${layoutItem.y}px`,
				width: `${layoutItem.width}px`,
				height: `${layoutItem.height}px`,
			}}
		>
			<EntityCard
				entity={layoutItem.item}
				layout="vertical"
				size="md"
				isSelected={isSelected}
				compact={false}
				className="w-full h-full"
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
			/>
		</motion.div>
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

	// Calcular layout usando el nuevo algoritmo
	const layoutResult = useMemo(() => {
		return calculateLayout(items, containerWidth);
	}, [calculateLayout, items, containerWidth]);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const currentTarget = e.currentTarget as HTMLElement;

		const isEmptySpaceClick = target === currentTarget ||
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
	}, [selectedIds.length]);

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
						const isSelected = selectedIds.includes(layoutItem.item.id);

						return (
							<MasonryItem
								key={layoutItem.item.id}
								layoutItem={layoutItem}
								isSelected={isSelected}
								itemIndex={index}
								onItemClick={onItemClick}
								onItemDoubleClick={onItemDoubleClick}
							/>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
});
