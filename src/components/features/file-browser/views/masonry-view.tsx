/**
 * @file Vista masonry mejorada tipo Pinterest con configuración avanzada
 * @module components/features					<EntityCard
						className="h-full w-full"
						compact={false}
						entity={layoutItem.item}
						isSelected={isSelected}
						layout="vertical"
						onClick={(e) => onItemClickById(layoutItem.item.id, e)}
						onDoubleClick={() => onItemDoubleClickById(layoutItem.item.id)}
						size="md"
					/>er/views/masonry-view
 */

import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
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
	};
	isSelected: boolean;
	itemIndex: number;
	onItemClickById: (id: string, e: React.MouseEvent) => void;
	onItemDoubleClickById: (id: string) => void;
	masonryConfig: {
		shouldUseAnimations: boolean;
		animationDuration: number;
		hoverEffects: boolean;
		showShadows: boolean;
		roundedCorners: boolean;
		showSelectionIndicators: boolean;
	};
}

const MasonryItem = memo<MasonryItemProps>(
	function MasonryItemComponent({
		layoutItem,
		isSelected,
		itemIndex,
		onItemClickById,
		onItemDoubleClickById,
		masonryConfig,
	}) {
		const style: React.CSSProperties = {
			position: 'absolute',
			left: layoutItem.x,
			top: layoutItem.y,
			width: layoutItem.width,
			height: layoutItem.height,
		};

		const handleClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onItemClickById(layoutItem.item.id, e);
			},
			[layoutItem.item.id, onItemClickById]
		);

		const handleDoubleClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onItemDoubleClickById(layoutItem.item.id);
			},
			[layoutItem.item.id, onItemDoubleClickById]
		);

		// OPTIMIZACIÓN: Propiedades de motion estables que no cambian entre renders
		const staticMotionProps = useMemo(
			() => ({
				layout: masonryConfig.shouldUseAnimations,
				initial: masonryConfig.shouldUseAnimations ? { opacity: 0, scale: 0.9 } : undefined,
				animate: masonryConfig.shouldUseAnimations ? { opacity: 1, scale: 1 } : undefined,
				exit: masonryConfig.shouldUseAnimations ? { opacity: 0, scale: 0.8 } : undefined,
				'data-testid': 'file-browser-item',
				'data-entity-id': layoutItem.item.id,
				'data-item-index': itemIndex,
			}),
			[masonryConfig.shouldUseAnimations, layoutItem.item.id, itemIndex]
		);

		const transition = useMemo(
			() => ({
				duration: masonryConfig.animationDuration / 1000,
				ease: [0.17, 0.67, 0.83, 0.67] as [number, number, number, number],
			}),
			[masonryConfig.animationDuration]
		);

		const itemClasses = cn('cursor-pointer select-none overflow-hidden', {
			'rounded-lg': masonryConfig.roundedCorners,
			'shadow-sm transition-shadow duration-200 hover:shadow-md': masonryConfig.showShadows,
			'ring-2 ring-primary ring-offset-2': isSelected && masonryConfig.showSelectionIndicators,
		});

		// Para elementos no animados, usar div simple
		if (!masonryConfig.shouldUseAnimations) {
			return (
				<button
					className={itemClasses}
					// Compat E2E/selectores
					data-entity-card=""
					data-entity-id={layoutItem.item.id}
					data-item-id={layoutItem.item.id}
					data-item-index={itemIndex}
					data-testid="file-browser-item"
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					style={style as React.CSSProperties}
					type="button"
				>
					<OptimizedEntityCard
						className="h-full w-full"
						compact={false}
						entity={layoutItem.item}
						isSelected={isSelected}
						layout="vertical"
						onClick={(e) => onItemClickById(layoutItem.item.id, e)}
						onDoubleClick={() => onItemDoubleClickById(layoutItem.item.id)}
						size="md"
					/>
				</button>
			);
		}

		return (
			<motion.button
				{...staticMotionProps}
				className={itemClasses}
				// Compat E2E/selectores
				data-entity-card=""
				data-item-id={layoutItem.item.id}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				style={style}
				transition={transition}
				type="button"
			>
				<OptimizedEntityCard
					className="h-full w-full"
					compact={false}
					entity={layoutItem.item}
					isSelected={isSelected}
					layout="vertical"
					onClick={(e) => onItemClickById(layoutItem.item.id, e)}
					onDoubleClick={() => onItemDoubleClickById(layoutItem.item.id)}
					size="md"
				/>
			</motion.button>
		);
	},
	(prevProps, nextProps) => {
		// OPTIMIZACIÓN: Comparación más eficiente que evita re-renders innecesarios
		const layoutChanged =
			prevProps.layoutItem.x !== nextProps.layoutItem.x ||
			prevProps.layoutItem.y !== nextProps.layoutItem.y ||
			prevProps.layoutItem.width !== nextProps.layoutItem.width ||
			prevProps.layoutItem.height !== nextProps.layoutItem.height;

		const propsChanged =
			prevProps.layoutItem.item.id !== nextProps.layoutItem.item.id ||
			prevProps.isSelected !== nextProps.isSelected ||
			prevProps.itemIndex !== nextProps.itemIndex;

		// OPTIMIZACIÓN: Comparación superficial de la configuración de masonry
		const configChanged =
			prevProps.masonryConfig.shouldUseAnimations !== nextProps.masonryConfig.shouldUseAnimations ||
			prevProps.masonryConfig.animationDuration !== nextProps.masonryConfig.animationDuration ||
			prevProps.masonryConfig.hoverEffects !== nextProps.masonryConfig.hoverEffects ||
			prevProps.masonryConfig.showShadows !== nextProps.masonryConfig.showShadows ||
			prevProps.masonryConfig.roundedCorners !== nextProps.masonryConfig.roundedCorners ||
			prevProps.masonryConfig.showSelectionIndicators !== nextProps.masonryConfig.showSelectionIndicators;

		// OPTIMIZACIÓN: No comparar funciones directamente ya que pueden cambiar de referencia
		// En su lugar, confiar en que los handlers estables no cambien innecesariamente
		return !(layoutChanged || propsChanged || configChanged);
	}
);

export const MasonryView = memo<MasonryViewProps>(function MasonryViewComponent({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
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

	// OPTIMIZACIÓN: Estabilizar handlers con dependencias mínimas usando useRef
	const stableHandlersRef = useRef({
		onItemClickById: (_id: string, _e: React.MouseEvent) => {
			// Placeholder
		},
		onItemDoubleClickById: (_id: string) => {
			// Placeholder
		},
	});

	// Actualizar handlers sin cambiar referencia
	useEffect(() => {
		stableHandlersRef.current.onItemClickById = (id: string, e: React.MouseEvent) => {
			const item = itemsById.get(id);
			if (item) {
				onItemClick(item, e);
			}
		};

		stableHandlersRef.current.onItemDoubleClickById = (id: string) => {
			const item = itemsById.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		};
	}, [itemsById, onItemClick, onItemDoubleClick]);

	// OPTIMIZACIÓN: Handlers estables que no cambian de referencia
	const handleItemClickById = useCallback((id: string, e: React.MouseEvent) => {
		stableHandlersRef.current.onItemClickById(id, e);
	}, []);

	const handleItemDoubleClickById = useCallback((id: string) => {
		stableHandlersRef.current.onItemDoubleClickById(id);
	}, []);

	// OPTIMIZACIÓN: Configuración estable de masonry para evitar cambios de props
	const masonryConfig = useMemo(
		() => ({
			shouldUseAnimations: config.animationsEnabled && items.length < 100,
			animationDuration: config.animationDuration,
			hoverEffects: config.hoverEffects,
			showShadows: config.showShadows,
			roundedCorners: config.roundedCorners,
			showSelectionIndicators: config.showSelectionIndicators,
		}),
		[
			config.animationsEnabled,
			config.animationDuration,
			config.hoverEffects,
			config.showShadows,
			config.roundedCorners,
			config.showSelectionIndicators,
			items.length,
		]
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
				!(
					target.closest('.entity-card') ||
					target.closest('[data-entity-card]') ||
					target.closest('button') ||
					target.closest('[role="button"]') ||
					target.closest('input') ||
					target.closest('textarea') ||
					target.closest('[data-testid="file-browser-item"]') ||
					target.closest('[style*="position: absolute"]') ||
					target.closest('[data-virtualized-item="true"]')
				);

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

	// Efecto eliminado - usando altura flexible
	// useEffect eliminado para evitar encogimiento al cargar

	if (!containerWidth || containerWidth <= 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground">Calculando layout masonry...</div>
			</div>
		);
	}

	return (
		<section
			className="h-full w-full"
			data-testid="masonry-view"
			data-view-type="masonry"
			ref={parentRef}
			style={{
				// Evitar contain: 'strict' que limita el cálculo de altura dentro de ScrollArea
				// y provoca contenedor muy pequeño sin scroll visible
				padding: `${config.spacing.padding}px`,
			}}
		>
			{/* Información de debug del layout (opcional) */}
			{process.env.NODE_ENV === 'development' && (
				<div className="fixed top-2 right-2 z-50 rounded border bg-background/90 p-2 font-mono text-xs backdrop-blur-sm">
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
					// Altura total del layout para que el viewport pueda hacer scroll
					height: `${layoutResult.totalHeight}px`,
				}}
			>
				<AnimatePresence initial={false}>
					{layoutResult.items.map((layoutItem, index) => {
						const isSelected = selectedIdsSet.has(layoutItem.item.id);

						return (
							<MasonryItem
								isSelected={isSelected}
								itemIndex={index}
								key={layoutItem.item.id}
								layoutItem={layoutItem}
								masonryConfig={masonryConfig}
								onItemClickById={handleItemClickById}
								onItemDoubleClickById={handleItemDoubleClickById}
							/>
						);
					})}
				</AnimatePresence>
			</div>
		</section>
	);
});

MasonryView.displayName = 'MasonryView';
